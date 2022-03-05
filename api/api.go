package api

import (
	"context"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type Client interface {
	Endpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error)
}

type officialClient struct {
	clientset *kubernetes.Clientset
}

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

func (c *officialClient) Endpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error) {
	return c.clientset.CoreV1().Endpoints(namespace).Get(ctx, name, metav1.GetOptions{})
}
