package handler

import (
	"net/http"

	"github.com/desotech-it/podlighter/api"
)

type apiHandler struct {
	mux    *http.ServeMux
	client api.Client
}

func (a *apiHandler) handleRoutes() {
	a.mux.Handle("/endpoints", &RestrictedHandler{
		AllowedMethods: []string{http.MethodGet, http.MethodHead, http.MethodOptions},
		Handler:        http.HandlerFunc(a.endpointsHandler),
	})
}

func (a *apiHandler) endpointsHandler(rw http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	if name := query.Get("name"); len(name) == 0 {
		http.Error(rw, "missing \"name\" parameter", http.StatusBadRequest)
	} else if endpoints, err := a.client.Endpoints(r.Context(), name, namespaceFromValues(query)); err != nil {
		clientErrorHandler{err}.ServeHTTP(rw, r)
	} else {
		JSONHandler(endpoints).ServeHTTP(rw, r)
	}
}

func (a *apiHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	a.mux.ServeHTTP(rw, r)
}

func ApiHandler(client api.Client) http.Handler {
	api := &apiHandler{http.NewServeMux(), client}
	api.handleRoutes()
	return api
}
