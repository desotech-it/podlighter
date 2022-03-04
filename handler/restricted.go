package handler

import (
	"net/http"
	"strings"
)

type RestrictedHandler struct {
	AllowedMethods []string
	Handler        http.Handler
}

func (h *RestrictedHandler) hasAllowedMethod(r *http.Request) bool {
	return indexOfString(h.AllowedMethods, r.Method) != -1
}

func (h *RestrictedHandler) writeAllowHeader(header http.Header) {
	header.Set(headerAllow, strings.Join(h.AllowedMethods, separatorComma))
}

func (h *RestrictedHandler) optionsHandler(rw http.ResponseWriter) {
	header := rw.Header()
	h.writeAllowHeader(header)
	rw.WriteHeader(http.StatusNoContent)
}

func (h *RestrictedHandler) notAllowedHandler(rw http.ResponseWriter) {
	header := rw.Header()
	h.writeAllowHeader(header)
	rw.WriteHeader(http.StatusMethodNotAllowed)
}

func (h *RestrictedHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if !h.hasAllowedMethod(r) {
		h.notAllowedHandler(rw)
	} else if r.Method == http.MethodOptions {
		h.optionsHandler(rw)
	} else {
		h.Handler.ServeHTTP(rw, r)
	}
}
