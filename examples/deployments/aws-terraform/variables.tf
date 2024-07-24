# variable "merlinn_release" {
#   description = "The merlinn release to deploy"
#   type        = string
#   default     = "0.4.12"
# }

data "http" "startup_script_remote" {
  url = "https://raw.githubusercontent.com/merlinn-co/merlinn/terraform-deploy/examples/deployments/aws-terraform/startup.sh"
}

data "template_file" "user_data" {
  template = data.http.startup_script_remote.response_body
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "us-west-1"
}

variable "instance_type" {
  description = "AWS EC2 Instance Type"
  type        = string
  default     = "t3.medium"
}


variable "public_access" {
  description = "Enable public ingress on port 8000"
  type        = bool
  default     = true // or false depending on your needs
}


locals {
  tags = {
    Name        = "merlinn-instance"
  }
}

variable "ssh_public_key" {
  description = "SSH Public Key"
  type        = string
  default     = "./merlinn-aws.pub"
}
variable "ssh_private_key" {
  description = "SSH Private Key"
  type        = string
  default     = "./merlinn-aws"
}

variable "merlinn_instance_volume_size" {
  description = "The size of the instance volume - the root volume"
  type        = number
  default     = 30
}

variable "merlinn_data_volume_size" {
  description = "EBS Volume Size of the attached data volume where your merlinn data is stored"
  type        = number
  default     = 20
}

variable "merlinn_data_volume_snapshot_before_destroy" {
    description = "Take a snapshot of the merlinn data volume before destroying it"
    type        = bool
    default     = true
}

variable "merlinn_data_restore_from_snapshot_id" {
    description = "Restore the merlinn data volume from a snapshot"
    type        = string
    default     = null
}

variable "merlinn_port" {
  default     = "8000"
  description = "The port that merlinn listens on"
  type        = string
}

variable "source_ranges" {
  default     = ["0.0.0.0/0"]
  type        = list(string)
  description = "List of CIDR ranges to allow through the firewall"
}

variable "mgmt_source_ranges" {
  default     = ["0.0.0.0/0"]
  type        = list(string)
  description = "List of CIDR ranges to allow for management of the Merlinn instance. This is used for SSH incoming traffic filtering"
}

variable "slack_bot_token" {
  description = "Slack Bot Token"
  type        = string
}

variable "slack_app_token" {
  description = "Slack App Token"
  type        = string
}

variable "slack_signing_secret" {
  description = "Slack Signing Secret"
  type        = string
}