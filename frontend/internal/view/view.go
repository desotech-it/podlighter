package view

import (
	"html/template"
	"io"
)

type view struct {
	template *template.Template
	data     interface{}
}

func (v *view) Render(wr io.Writer) error {
	return v.template.Execute(wr, v.data)
}

type HomeView struct {
	view
}

func NewHomeView(title string) *HomeView {
	return &HomeView{
		view{
			template: homeTemplate,
			data: struct {
				Title string
			}{
				Title: title,
			},
		},
	}
}
