package http

import (
	"net/http"
	"strings"
)

const (
	ContentTypeApplicationJSON = "application/json; charset=utf-8"
)

func SetContentType(header http.Header, value string) {
	header.Set("Content-Type", value)
	header.Set("X-Content-Type-Options", "nosniff")
}

func RestrictedHandler(allowedMethods []string, handler http.Handler) http.Handler {
	return &restrictedHandler{
		allowedMethods: allowedMethods,
		allowValue:     strings.Join(allowedMethods, ", "),
		handler:        handler,
	}
}

func JSONHandler(v interface{}) http.Handler {
	return &jsonHandler{v}
}
