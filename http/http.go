package http

import "net/http"

const (
	separatorComma = ", "
)

const (
	HeaderAllow               = "Allow"
	HeaderContentType         = "Content-Type"
	HeaderXContentTypeOptions = "X-Content-Type-Options"
)

const (
	MimeApplicationJSON = "application/json; charset=utf-8"
)

func SetContentType(header http.Header, mime string) {
	header.Set(HeaderContentType, mime)
	header.Set(HeaderXContentTypeOptions, "nosniff")
}

func RestrictedHandler(allowedMethods []string, handler http.Handler) http.Handler {
	return &restrictedHandler{
		AllowedMethods: allowedMethods,
		Handler:        handler,
	}
}

func JSONHandler(v interface{}) http.Handler {
	return &jsonHandler{v}
}
