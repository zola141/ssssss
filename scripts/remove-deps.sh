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
echo -e "${MAGENTA}     🗑️  LudoX Dependency Removal Script 🗑️    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}📍 Project Root: $ROOT_DIR${NC}\n"

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}═══════════════════════════════════${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${YELLOW}═══════════════════════════════════${NC}\n"
}

# Function to confirm action
confirm() {
  local prompt="$1"
  local response
  
  echo -e "${YELLOW}⚠️  WARNING: This will remove all node_modules directories${NC}"
  echo -e "${YELLOW}⚠️  This action cannot be easily undone${NC}\n"
  read -p "$(echo -e "${RED}$prompt${NC}") (yes/no): " response
  
  if [ "$response" = "yes" ]; then
    return 0
  else
    echo -e "${BLUE}Cancelled.${NC}"
    exit 0
  fi
}

# Function to remove node_modules
remove_deps() {
  local dir=$1
  local name=$2
  
  if [ ! -d "$dir/node_modules" ]; then
    echo -e "${YELLOW}⏭️  $name: node_modules not found (skipping)${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}🗑️  Removing $name dependencies...${NC}"
  rm -rf "$dir/node_modules"
  echo -e "${GREEN}✅ Removed $name node_modules${NC}"
}

# Confirm before proceeding
print_header "Confirmation Required"
confirm "Do you want to remove all dependencies?"

# Remove dependencies for each module
print_header "Removing All Dependencies"

echo -e "${BLUE}Root Dependencies${NC}"
remove_deps "$ROOT_DIR" "Root"

echo -e "\n${BLUE}Salah Part (Backend)${NC}"
remove_deps "$ROOT_DIR/salah_part/backend" "Salah Backend"

echo -e "\n${BLUE}Kamal Part (Frontend)${NC}"
remove_deps "$ROOT_DIR/kamal_part" "Kamal Frontend"

echo -e "\n${BLUE}Hamza Part (Leaderboard)${NC}"
remove_deps "$ROOT_DIR/hamza_part" "Hamza Leaderboard"

# Check if hamza_part/frontend exists
if [ -d "$ROOT_DIR/hamza_part/frontend" ]; then
  echo -e "\n${BLUE}Hamza Frontend${NC}"
  remove_deps "$ROOT_DIR/hamza_part/frontend" "Hamza Frontend"
fi

echo -e "\n${BLUE}Soumya Part (Game UI)${NC}"
remove_deps "$ROOT_DIR/soumya_part/game_ui" "Game UI"

# Check for thegame directory
if [ -d "$ROOT_DIR/thegame" ]; then
  echo -e "\n${BLUE}The Game${NC}"
  remove_deps "$ROOT_DIR/thegame" "The Game"
fi

print_header "Removal Complete"
echo -e "${GREEN}✅ All dependencies removed successfully!${NC}"
echo -e "${BLUE}To reinstall, run: ./scripts/install-deps.sh${NC}\n"
