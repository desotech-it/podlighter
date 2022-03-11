package api

import (
	"net/http"
	"regexp"

	pkghttp "github.com/desotech-it/podlighter/http"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
)

type apiHandler struct {
	mux    *http.ServeMux
	client Client
}

func (a *apiHandler) handleRoutes() {
	a.mux.Handle("/endpoints/",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			endpointsHandler{a.client},
		),
	)

	a.mux.Handle("/namespaces",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			namespacesHandler{a.client},
		),
	)
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

var endpointsRegexp = regexp.MustCompile("/endpoints/([^/]+)/?$")

type endpointsHandler struct {
	getter EndpointsGetter
}

func (h endpointsHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	indexes := endpointsRegexp.FindStringSubmatchIndex(path)
	if len(indexes) < 4 {
		http.NotFound(rw, r)
	} else {
		nameBeginIndex := indexes[2]
		nameEndIndex := indexes[3]
		name := path[nameBeginIndex:nameEndIndex]
		query := r.URL.Query()
		if endpoints, err := h.getter.GetEndpoints(r.Context(), name, namespaceFromValues(query)); err != nil {
			handleClientError(err, rw)
		} else {
			pkghttp.JSONHandler(endpoints).ServeHTTP(rw, r)
		}
	}
}

type namespacesHandler struct {
	lister NamespaceLister
}

func (h namespacesHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if namespaces, err := h.lister.ListNamespaces(r.Context()); err != nil {
		handleClientError(err, rw)
	} else {
		pkghttp.JSONHandler(namespaces).ServeHTTP(rw, r)
	}
}
