package api

import (
	"net/http"
	"strings"
)

const (
	separatorComma = ", "
)

const (
	headerAllow               = "Allow"
	headerContentType         = "Content-Type"
	headerXContentTypeOptions = "X-Content-Type-Options"
)

const (
	mimeApplicationJSON = "application/json; charset=utf-8"
)

const (
	valueNoSniff = "nosniff"
)

type restrictedHandler struct {
	AllowedMethods []string
	Handler        http.Handler
}

func indexOfString(haystack []string, needle string) int {
	for i, s := range haystack {
		if s == needle {
			return i
		}
	}
	return -1
}

func writeContentTypeHeader(mime string, header http.Header) {
	header.Set(headerContentType, mime)
	header.Set(headerXContentTypeOptions, valueNoSniff)
}

func (h *restrictedHandler) hasAllowedMethod(r *http.Request) bool {
	return indexOfString(h.AllowedMethods, r.Method) != -1
}

func (h *restrictedHandler) writeAllowHeader(header http.Header) {
	header.Set(headerAllow, strings.Join(h.AllowedMethods, separatorComma))
}

func (h *restrictedHandler) optionsHandler(rw http.ResponseWriter) {
	header := rw.Header()
	h.writeAllowHeader(header)
	rw.WriteHeader(http.StatusNoContent)
}

func (h *restrictedHandler) notAllowedHandler(rw http.ResponseWriter) {
	header := rw.Header()
	h.writeAllowHeader(header)
	rw.WriteHeader(http.StatusMethodNotAllowed)
}

func (h *restrictedHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if !h.hasAllowedMethod(r) {
		h.notAllowedHandler(rw)
	} else if r.Method == http.MethodOptions {
		h.optionsHandler(rw)
	} else {
		h.Handler.ServeHTTP(rw, r)
	}
}
