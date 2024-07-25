#! /bin/bash

# Note: This is run as root

echo "Starting startup script..."

echo "CD to home directory"
cd /home/ubuntu

export slack_bot_token="${slack_bot_token}"
export slack_app_token="${slack_app_token}"
export slack_signing_secret="${slack_signing_secret}"
export openai_token="${openai_token}"

replace_env_value() {
  local filename=$1
  local variable_name=$2
  local new_value=$3

  # Use sed to replace the value of the variable
  sed -i "s|$${variable_name=\"[^\"]*\"|$${variable_name}=\"$${new_value}\"|g" "$${filename}"
}

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
git clone https://github.com/merlinn-co/merlinn.git && cd merlinn

cp config/litellm/.env.example config/litellm/.env
cp config/litellm/config.example.yaml config/litellm/config.yaml
replace_env_value config/litellm/.env OPENAI_API_KEY $openai_token

cp .env.example .env
replace_env_value .env SLACK_BOT_TOKEN $slack_bot_token
replace_env_value .env SLACK_APP_TOKEN $slack_app_token
replace_env_value .env SLACK_SIGNING_SECRET $slack_signing_secret

docker compose up -d --build

echo "Done!"
