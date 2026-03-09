#!/bin/bash

# Exit on error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get the script's directory and root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}    📦 LudoX Dependency Installation Script 📦  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}📍 Project Root: $ROOT_DIR${NC}\n"

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}═══════════════════════════════════${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${YELLOW}═══════════════════════════════════${NC}\n"
}

# Function to check if directory exists
check_dir() {
  if [ ! -d "$1" ]; then
    echo -e "${RED}❌ Directory not found: $1${NC}"
    return 1
  fi
  return 0
}

# Function to install npm packages
install_deps() {
  local dir=$1
  local name=$2
  
  echo -e "${YELLOW}📦 Installing $name dependencies...${NC}"
  cd "$dir" || return 1
  
  if npm install; then
    echo -e "${GREEN}✅ $name dependencies installed${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to install $name dependencies${NC}"
    return 1
  fi
}

# Validate directories
print_header "Validating Project Structure"
check_dir "$ROOT_DIR/salah_part/backend" || exit 1
check_dir "$ROOT_DIR/kamal_part" || exit 1
check_dir "$ROOT_DIR/hamza_part" || exit 1
check_dir "$ROOT_DIR/soumya_part/game_ui" || exit 1
echo -e "${GREEN}✅ All directories validated${NC}"

# Install dependencies for each module
print_header "Installing All Dependencies"

echo -e "${BLUE}Installing Root Dependencies${NC}"
install_deps "$ROOT_DIR" "Root" || exit 1

echo -e "\n${BLUE}Installing Salah Part (Backend)${NC}"
install_deps "$ROOT_DIR/salah_part/backend" "Salah Backend" || exit 1

echo -e "\n${BLUE}Installing Kamal Part (Frontend)${NC}"
install_deps "$ROOT_DIR/kamal_part" "Kamal Frontend" || exit 1

echo -e "\n${BLUE}Installing Hamza Part (Leaderboard)${NC}"
install_deps "$ROOT_DIR/hamza_part" "Hamza Leaderboard" || exit 1

echo -e "\n${BLUE}Installing Soumya Part (Game UI)${NC}"
install_deps "$ROOT_DIR/soumya_part/game_ui" "Game UI" || exit 1

# Check if there's a hamza_part/frontend
if check_dir "$ROOT_DIR/hamza_part/frontend"; then
  echo -e "\n${BLUE}Installing Hamza Frontend${NC}"
  install_deps "$ROOT_DIR/hamza_part/frontend" "Hamza Frontend" || true
fi

print_header "Installation Complete"
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo -e "${BLUE}You can now run the project with: ./scripts/start.sh${NC}\n"
