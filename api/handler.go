package api

import (
	"net/http"
	"regexp"

	pkghttp "github.com/desotech-it/podlighter/http"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
)

var (
	endpointsRegexp = regexp.MustCompile("/endpoints/([^/]+)/?$")
	servicesRegexp  = regexp.MustCompile("/services/([^/]+)/?$")
)

type apiHandler struct {
	mux    *http.ServeMux
	client Client
}

func (a *apiHandler) handleRoutes() {
	a.mux.Handle("/services/",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			servicesHandler{a.client},
		),
	)

	a.mux.Handle("/services",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			servicesListHandler{a.client},
		),
	)

	a.mux.Handle("/endpoints/",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			endpointsHandler{a.client},
		),
	)

	a.mux.Handle("/endpoints",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			endpointsListHandler{a.client},
		),
	)

	a.mux.Handle("/namespaces",
		pkghttp.RestrictedHandler(
			[]string{http.MethodGet, http.MethodHead, http.MethodOptions},
			namespacesListHandler{a.client},
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

type servicesHandler struct {
	getter ServiceGetter
}

func (h servicesHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	indexes := servicesRegexp.FindStringSubmatchIndex(path)
	if len(indexes) < 4 {
		http.NotFound(rw, r)
	} else {
		nameBeginIndex := indexes[2]
		nameEndIndex := indexes[3]
		name := path[nameBeginIndex:nameEndIndex]
		query := r.URL.Query()
		if endpoints, err := h.getter.GetServices(r.Context(), name, namespaceFromValues(query)); err != nil {
			handleClientError(err, rw)
		} else {
			pkghttp.JSONHandler(endpoints).ServeHTTP(rw, r)
		}
	}
}

type servicesListHandler struct {
	lister ServiceGetter
}

func (h servicesListHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	namespace := namespaceFromValues(r.URL.Query())
	if services, err := h.lister.ListServices(r.Context(), namespace); err != nil {
		handleClientError(err, rw)
	} else {
		pkghttp.JSONHandler(services).ServeHTTP(rw, r)
	}
}

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

type endpointsListHandler struct {
	lister EndpointsGetter
}

func (h endpointsListHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	namespace := namespaceFromValues(r.URL.Query())
	if endpoints, err := h.lister.ListEndpoints(r.Context(), namespace); err != nil {
		handleClientError(err, rw)
	} else {
		pkghttp.JSONHandler(endpoints).ServeHTTP(rw, r)
	}
}

type namespacesListHandler struct {
	lister NamespaceGetter
}

func (h namespacesListHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if namespaces, err := h.lister.ListNamespaces(r.Context()); err != nil {
		handleClientError(err, rw)
	} else {
		pkghttp.JSONHandler(namespaces).ServeHTTP(rw, r)
	}
}
