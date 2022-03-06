package handler

import (
	"net/http"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
)

type clientErrorHandler struct {
	err error
}

func (h clientErrorHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if statusError, ok := h.err.(*apierrors.StatusError); ok {
		http.Error(rw, statusError.Error(), int(statusError.ErrStatus.Code))
	} else {
		http.Error(rw, h.err.Error(), http.StatusBadGateway)
	}
}
