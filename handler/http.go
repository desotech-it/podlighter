package handler

import "net/http"

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

func writeContentTypeHeader(mime string, header http.Header) {
	header.Set(headerContentType, mime)
	header.Set(headerXContentTypeOptions, valueNoSniff)
}
