#! /bin/bash

# Note: This is run as root

echo "Starting startup script..."

echo "CD to home directory"
cd /home/ubuntu
sudo chown -R $USER:$USER /home/ubuntu

echo "Setting up environment variables..."
export slack_bot_token="${slack_bot_token}"
export slack_app_token="${slack_app_token}"
export slack_signing_secret="${slack_signing_secret}"
export openai_token="${openai_token}"
export public_ip="$(curl http://checkip.amazonaws.com)"

replace_env_value() {
  local filename=$1
  local variable_name=$2
  local new_value=$3

  # Use sed to replace the value of the variable
  sed -i "s|$variable_name=\"[^\"]*\"|$variable_name=\"$new_value\"|g" "$filename"
}

replace_value() {
  local filename=$1
  local variable_name=$2
  local new_value=$3

  # Use sed to replace the value of the variable
  sed -i "s|$variable_name|$new_value|g" "$filename"
}

echo "Installing dependencies..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release
mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
chmod a+r /etc/apt/keyrings/docker.gpg
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
usermod -aG docker ubuntu

echo "About to clone the repository..."
git clone https://github.com/merlinn-co/merlinn.git && cd merlinn
git config --global --add safe.directory '*'

echo "Injecting environment variables..."
cp config/litellm/.env.example config/litellm/.env
cp config/litellm/config.example.yaml config/litellm/config.yaml
replace_env_value config/litellm/.env OPENAI_API_KEY $openai_token

cp .env.example .env
replace_env_value .env SLACK_BOT_TOKEN $slack_bot_token
replace_env_value .env SLACK_APP_TOKEN $slack_app_token
replace_env_value .env SLACK_SIGNING_SECRET $slack_signing_secret
replace_env_value .env DASHBOARD_APP_URL http://$public_ip:5173
replace_env_value .env DASHBOARD_API_URL http://$public_ip:3000
replace_env_value .env DASHBOARD_ORY_URL http://$public_ip:4433
replace_env_value .env KRATOS_SELF_SERVE_UI_BROWSER_URL http://$public_ip:4433

# Change Ory Kratos configuration
replace_value config/kratos/kratos.yml localhost $public_ip
replace_value config/kratos/kratos.yml host.docker.internal $public_ip

echo "Running docker compose..."
docker compose up -d --build

echo "Done!"
