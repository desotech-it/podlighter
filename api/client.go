package api

import (
	"context"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type Client interface {
	ServiceGetter
	EndpointsGetter
	NamespaceGetter
}

type EndpointsGetter interface {
	GetEndpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error)
	ListEndpoints(ctx context.Context, namespace string) (*v1.EndpointsList, error)
}

type ServiceGetter interface {
	GetServices(ctx context.Context, name, namespace string) (*v1.Service, error)
	ListServices(ctx context.Context, namespace string) (*v1.ServiceList, error)
}

type NamespaceGetter interface {
	ListNamespaces(ctx context.Context) (*v1.NamespaceList, error)
}

type officialClient struct {
	clientset *kubernetes.Clientset
}

func (c *officialClient) GetEndpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error) {
	return c.clientset.CoreV1().Endpoints(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (c *officialClient) ListEndpoints(ctx context.Context, namespace string) (*v1.EndpointsList, error) {
	return c.clientset.CoreV1().Endpoints(namespace).List(ctx, metav1.ListOptions{})
}

func (c *officialClient) GetServices(ctx context.Context, name, namespace string) (*v1.Service, error) {
	return c.clientset.CoreV1().Services(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (c *officialClient) ListServices(ctx context.Context, namespace string) (*v1.ServiceList, error) {
	return c.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
}

func (c *officialClient) ListNamespaces(ctx context.Context) (*v1.NamespaceList, error) {
	return c.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
}
