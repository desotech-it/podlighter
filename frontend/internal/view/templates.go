package view

import "html/template"

var (
	baseTemplate *template.Template
	homeTemplate *template.Template
)

func extendTemplate(srcTemplate *template.Template, filenames ...string) *template.Template {
	cloned := template.Must(srcTemplate.Clone())
	return template.Must(cloned.ParseFiles(filenames...))
}

func init() {
	baseTemplate = template.Must(template.ParseFiles("templates/base.gohtml"))
	homeTemplate = extendTemplate(baseTemplate, "templates/home.gohtml")
}
