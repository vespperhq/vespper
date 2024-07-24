terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Define provider
variable "AWS_ACCESS_KEY" {}
variable "AWS_SECRET_ACCESS_KEY" {}

provider "aws" {
  access_key = var.AWS_ACCESS_KEY
  secret_key = var.AWS_SECRET_ACCESS_KEY
  region     = var.region
}

# Create security group
resource "aws_security_group" "merlinn_sg" {
  name        = "merlinn-cluster-sg"
  description = "Security group for the cluster nodes"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.mgmt_source_ranges
  }

  dynamic "ingress" {
    for_each = var.public_access ? [1] : []
    content {
      from_port   = var.merlinn_port
      to_port     = 8000
      protocol    = "tcp"
      cidr_blocks = var.source_ranges
    }
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = local.tags
}

resource "aws_key_pair" "merlinn-keypair" {
  key_name   = "merlinn-keypair"  # Replace with your desired key pair name
  public_key = file(var.ssh_public_key)  # Replace with the path to your public key file
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  owners = ["099720109477"] # Canonical
}
# Create EC2 instances
resource "aws_instance" "merlinn_instance" {
  ami             = data.aws_ami.ubuntu.id
  instance_type   = var.instance_type
  key_name        = "merlinn-keypair"
  security_groups = [aws_security_group.merlinn_sg.name]

  user_data = data.template_file.user_data.rendered

  tags = local.tags

  ebs_block_device {
    device_name = "/dev/sda1"
    volume_size = var.merlinn_instance_volume_size  # size in GBs
  }
}


resource "aws_ebs_volume" "merlinn-volume" {
  availability_zone = aws_instance.merlinn_instance.availability_zone
  size              = var.merlinn_data_volume_size
  final_snapshot = var.merlinn_data_volume_snapshot_before_destroy
  snapshot_id = var.merlinn_data_restore_from_snapshot_id

  tags = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

locals {
  cleaned_volume_id = replace(aws_ebs_volume.merlinn-volume.id, "-", "")
}

locals {
  restore_from_snapshot = length(var.merlinn_data_restore_from_snapshot_id) == 0 ? false : true
}

resource "aws_volume_attachment" "merlinn_volume_attachment" {
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.merlinn-volume.id
  instance_id = aws_instance.merlinn_instance.id
  provisioner "remote-exec" {
    inline = [
      "if [ -z \"${local.restore_from_snapshot}\"  ]; then export VOLUME_ID=${local.cleaned_volume_id} && sudo mkfs -t ext4 /dev/$(lsblk -o +SERIAL | grep $VOLUME_ID | awk '{print $1}'); fi",
      "sudo mkdir /merlinn-data",
      "export VOLUME_ID=${local.cleaned_volume_id} && sudo mount /dev/$(lsblk -o +SERIAL | grep $VOLUME_ID | awk '{print $1}') /merlinn-data",
      "export VOLUME_ID=${local.cleaned_volume_id} && cat <<EOF | sudo tee /etc/fstab >> /dev/null",
      "/dev/$(lsblk -o +SERIAL | grep $VOLUME_ID | awk '{print $1}') /merlinn-data ext4 defaults,nofail,discard 0 0",
      "EOF",
    ]

    connection {
      host = aws_instance.merlinn_instance.public_ip
      type = "ssh"
      user = "ubuntu"
      private_key = file(var.ssh_private_key)
    }
  }
    depends_on = [aws_instance.merlinn_instance, aws_ebs_volume.merlinn-volume]
}


output "instance_public_ip" {
  value = aws_instance.merlinn_instance.public_ip
}

output "instance_private_ip" {
  value = aws_instance.merlinn_instance.private_ip
}
