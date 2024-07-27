# AWS EC2 Basic Deployment

This guide provides an example deployment to AWS EC2 Compute using [Terraform](https://www.terraform.io/).

More specifically, this deployment will do the following:

- Create a security group with the necessary ports open (3000, 5173, 4433, 4455)
- Launch an EC2 instance (t3.large) with Ubuntu 22.04 and deploy Merlinn using Git + Docker Compose.
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
export TF_VAR_openai_token="your openai api key"
```

> Note: if you want to change your setup (use custom models, change ports etc), you can SSH into your machine and change your setup there.

Now run apply:

```bash
terraform apply -auto-approve
```

### 5. Check that Merlinn is running

Follow these steps to make sure everything is working:

#### 5.1 Get the public IP of your instance

Run the following command in your terminal:

```bash
export instance_public_ip=$(terraform output instance_public_ip | sed 's/"//g')
```

#### 5.2 Connect to your instance:

Connect to your EC2 via SSH:

```bash
ssh -i ./merlinn-aws ubuntu@$instance_public_ip
```

#### 5.3 Make sure Docker process is complete

Check the status of the startup script:

```bash
tail -f /var/log/cloud-init-output.log
```

This command would tail the log file that the EC2 writes to when running the startup script.
The startup script should take about 10-13 minutes to complete. You can have a look at it at `examples/deployments/aws-terraform/startup.sh`

When it's done, you should see a similar message at the bottom:

```
Done!
Cloud-init v. 24.1.3-0ubuntu1~22.04.5 finished at Fri, 26 Jul 2024 09:32:37 +0000. Datasource DataSourceEc2Local.  Up 937.21 seconds
```

You can also double check all the containers are up using `docker ps`.

### 6. Try to access the UI

Use the public IP from before (run `terraform output instance_public_ip` if you don't have it already) and navigate in the browser to `http:{instance_public_ip}:5173`. This should open the Merlinn UI, where you can sign up and configure your organization & integrations!

### 7. Destroy your Merlinn instance

If you wish to destroy all this setup and remove all the resouces, run the following command:

```bash
terraform destroy
```
