#!/bin/bash

# VPS Tab Completions for Agent-Banks VPS Manager
# Install: source vps_completions.sh

_vps_completions() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Define all available commands
    opts="deploy package upload install start stop restart status logs health config keys hostname firewall ssh test ping web monitor backup update clean help"
    
    # Command-specific completions
    case "${prev}" in
        "vps")
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        "config")
            COMPREPLY=( $(compgen -W "edit view backup restore" -- ${cur}) )
            return 0
            ;;
        "keys")
            COMPREPLY=( $(compgen -W "anthropic openrouter elevenlabs browserbase" -- ${cur}) )
            return 0
            ;;
        "logs")
            COMPREPLY=( $(compgen -W "follow tail error debug" -- ${cur}) )
            return 0
            ;;
        "backup")
            COMPREPLY=( $(compgen -W "create restore list delete" -- ${cur}) )
            return 0
            ;;
        *)
            ;;
    esac
    
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
}

# Register the completion function
complete -F _vps_completions vps