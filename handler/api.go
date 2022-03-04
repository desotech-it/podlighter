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
	if endpoints, err := a.client.Endpoints(r.Context(), "nginx", "podlighter"); err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
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
