#!/usr/bin/env bash
set -e

DIR=$(dirname "$0")
cd "$DIR" || exit 1

# ----------------------------
# Helper functions
# ----------------------------
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# ----------------------------
# Detect OS
# ----------------------------
OS="$(uname -s)"
info "Detected OS: $OS"

# ----------------------------
# Install OpenTofu
# ----------------------------
install_opentofu_linux() {
    info "Installing OpenTofu for Linux..."
#    LATEST=$(curl -s https://api.github.com/repos/opentofu/opentofu/releases/latest | grep browser_download_url | grep linux_amd64.zip | cut -d '"' -f 4)
    LATEST=https://github.com/opentofu/opentofu/releases/download/v1.10.5/tofu_1.10.5_linux_amd64.zip
    cd /tmp || exit 1
    curl -LO "$LATEST"
    unzip -o tofu_*_linux_amd64.zip
    sudo mv tofu /usr/local/bin/
    rm tofu_*_linux_amd64.zip
    info "OpenTofu version: $(tofu version)"
    cd $DIR || exit 1
}

install_opentofu_mac() {
    info "Installing OpenTofu via Homebrew..."
    if ! command_exists brew; then
        error "Homebrew not found. Install it first: https://brew.sh/"
        exit 1
    fi
    brew tap opentofu/opentofu
    brew install opentofu
    info "OpenTofu version: $(opentofu version)"
}

# ----------------------------
# Install Docker
# ----------------------------
install_docker_linux() {
    info "Installing Docker for Linux..."
    sudo apt update
    sudo apt install -y ca-certificates curl gnupg lsb-release unzip
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl enable docker
    info "Docker version: $(docker --version)"
}

install_docker_mac() {
    info "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
}

# ----------------------------
# Install Yarn
# ----------------------------
install_yarn_linux() {
    info "Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
    info "Installing Yarn..."
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo apt update
    sudo apt install -y yarn
    info "Yarn version: $(yarn --version)"
}

install_yarn_mac() {
    info "Installing Yarn via Homebrew..."
    brew install yarn
    info "Yarn version: $(yarn --version)"
}

# ----------------------------
# Main installation flow
# ----------------------------
if [[ "$OS" == "Linux" ]]; then
    install_opentofu_linux
    install_docker_linux
    install_yarn_linux
elif [[ "$OS" == "Darwin" ]]; then
    install_opentofu_mac
    install_docker_mac
    install_yarn_mac
else
    error "Unsupported OS: $OS"
    exit 1
fi

info "Installation completed successfully!"
