package api

import (
	"context"

	"k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (a *Api) Endpoints(ctx context.Context, name, namespace string) (*v1.Endpoints, error) {
	return a.clientset.CoreV1().Endpoints(namespace).Get(ctx, name, metav1.GetOptions{})
}
