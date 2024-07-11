echo "Creating merlinn directory"
mkdir -p merlinn
test -e merlinn

# Change directory to merlinn
cd merlinn

which curl &> /dev/null || echo "curl is not installed. Please install curl and try again."

curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/.env.example --output .env
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/litellm/.env.example --output config/litellm/.env
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/litellm/config.example.yaml --output config/litellm/config.yaml
