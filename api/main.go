package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
)

type Api struct {
	mux    *http.ServeMux
	client Client
}

func (a *Api) handleRoutes() {
	a.mux.Handle("/endpoints", &restrictedHandler{
		AllowedMethods: []string{http.MethodGet, http.MethodHead, http.MethodOptions},
		Handler:        &endpointsHandler{a.client},
	})
}

func (a *Api) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	a.mux.ServeHTTP(rw, r)
}

func marshalJSON(v interface{}) (io.Reader, error) {
	buff := new(bytes.Buffer)
	if err := json.NewEncoder(buff).Encode(v); err != nil {
		return nil, err
	} else {
		return buff, nil
	}
}

func WithClient(client Client) *Api {
	api := &Api{http.NewServeMux(), client}
	api.handleRoutes()
	return api
}
