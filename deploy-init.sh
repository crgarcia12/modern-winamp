#!/bin/bash
# Liliput Deployment Initialization Script
# This script creates the necessary namespace if it doesn't exist

NAMESPACE="devx-crgarcia12-modern-winamp-liliput-920ccf05"

echo "Checking if namespace $NAMESPACE exists..."

# Check if kubectl is available
if command -v kubectl >/dev/null 2>&1; then
    echo "kubectl found, attempting to create namespace..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    if [ $? -eq 0 ]; then
        echo "Namespace $NAMESPACE created or already exists"
    else
        echo "Failed to create namespace $NAMESPACE"
        exit 1
    fi
    
    # Apply the deployment manifests
    echo "Applying Kubernetes manifests..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/deployment.yaml
    
else
    echo "kubectl not available, skipping namespace creation"
    echo "Namespace manifests are available in k8s/ directory"
fi

echo "Deployment initialization complete"