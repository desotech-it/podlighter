package api

import (
	"context"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type Client interface {
	Endpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error)
}

type officialClient struct {
	clientset *kubernetes.Clientset
}

func (c *officialClient) Endpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error) {
	return c.clientset.CoreV1().Endpoints(namespace).Get(ctx, name, metav1.GetOptions{})
}
