echo "Creating merlinn directory"
mkdir -p merlinn
test -e merlinn

# Change directory to merlinn
cd merlinn

which curl &> /dev/null || echo "curl is not installed. Please install curl and try again."

curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/docker-compose.common.yml --output docker-compose.common.yml
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/docker-compose.images.yml --output docker-compose.yml

docker compose up -d