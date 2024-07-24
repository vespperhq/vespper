# AWS EC2 Basic Deployment

This guide provides an example deployment to AWS EC2 Compute using [Terraform](https://www.terraform.io/).

More specifically, this deployment will do the following:

- Create a security group with the necessary ports open (22 and 8000)
- Launch an EC2 instance with Ubuntu 22.04 and deploy Merlinn using Docker Compose
- Create a data volume for Merlinn's data
- Mount the data volume to the EC2 instance
- Format the data volume with ext4
- Start Merlinn

## Requirements

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [Terraform](https://www.terraform.io/)

  Apple Chip - Follow these steps:

  ```bash
  brew install tfenv
  TFENV_ARCH=amd64 tfenv install latest
  tfenv use latest
  ```

  Intel Chip - Follow the [official docs](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli#install-terraform).

## Installation

Follow the following steps to deploy Merlinn to your AWS environment using Terraform:

### 0. Navigate to the current folder

```bash
cd examples/deployments/aws-terraform
```

### 1. Authenticate to AWS

If you haven't authenticated yourself to AWS yet, [create a new access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user_manage_add-key.html).

Afterwards, copy the access key and secret key values and run the following command:

```bash
aws configure
```

You'd be asked to insert your keys.

### 2. Init your terraform state

```bash
terraform init
```

### 3. Create SSH key

Generate SSH key to use with your merlinn instance, in order for you to login to your EC2:

```bash
ssh-keygen -t RSA -b 4096 -C "Merlinn AWS Key" -N "" -f ./merlinn-aws && chmod 400 ./merlinn-aws
```

### 4. Set up your Terraform variables and deploy your instance:

Define the following environment variables. Make sure you insert the desired `region` and the Slack tokens:

```bash
export TF_VAR_slack_bot_token="your slack bot token"
export TF_VAR_slack_app_token="your slack app token"
export TF_VAR_slack_signing_secret="your slack signing secret"
# AWS region to deploy the merlinn instance to
export TF_VAR_region="us-east-1"
#enable public access to the merlinn instance on port 8000
export TF_VAR_public_access="true"
#optional - if you want to restore from a snapshot
export TF_VAR_merlinn_data_restore_from_snapshot_id=""
#optional - if you want to snapshot the data volume before destroying the instance
export TF_VAR_merlinn_data_volume_snapshot_before_destroy="true"
```

Now run apply:

```bash
terraform apply -auto-approve
```

### 5. Check your public IP and that Merlinn is running

Get the public IP of your instance

```bash
terraform output instance_public_ip
```

Check that Merlinn is running (It should take up several minutes for the instance to be ready)

```bash
export instance_public_ip=$(terraform output instance_public_ip | sed 's/"//g')
curl -v http://$instance_public_ip:3000/
```

#### 4.2 Connect (ssh) to your instance

To SSH to your instance:

```bash
ssh -i ./merlinn-aws ubuntu@$instance_public_ip
```

### 5. Destroy your Merlinn instance

You will need to change `prevent_destroy` to `false` in the `aws_ebs_volume` in `merlinn.tf`.

```bash
terraform destroy
```

## Extras

You can visualize your infrastructure with:

```bash
terraform graph | dot -Tsvg > graph.svg
```

> Note: You will need graphviz installed for this to work
