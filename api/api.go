package api

import (
	"net/http"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func NewClient(kubeconfigPath string) (Client, error) {
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, err
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	client := &officialClient{clientset}
	return client, nil
}

func NewHandler(client Client) http.Handler {
	api := &apiHandler{http.NewServeMux(), client}
	api.handleRoutes()
	return api
}
