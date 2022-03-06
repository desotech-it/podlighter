package api

import (
	"net/http"

	pkghttp "github.com/desotech-it/podlighter/http"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
)

type apiHandler struct {
	mux    *http.ServeMux
	client Client
}

func (a *apiHandler) handleRoutes() {
	a.mux.Handle("/endpoints",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			http.HandlerFunc(a.endpointsHandler),
		),
	)
}

func (a *apiHandler) endpointsHandler(rw http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	if name := query.Get("name"); len(name) == 0 {
		http.Error(rw, "missing \"name\" parameter", http.StatusBadRequest)
	} else if endpoints, err := a.client.Endpoints(r.Context(), name, namespaceFromValues(query)); err != nil {
		handleClientError(err, rw)
	} else {
		pkghttp.JSONHandler(endpoints).ServeHTTP(rw, r)
	}
}

func (a *apiHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	a.mux.ServeHTTP(rw, r)
}

func handleClientError(err error, rw http.ResponseWriter) {
	if statusError, ok := err.(*apierrors.StatusError); ok {
		http.Error(rw, statusError.ErrStatus.Message, int(statusError.ErrStatus.Code))
	} else {
		http.Error(rw, err.Error(), http.StatusBadGateway)
	}
}
