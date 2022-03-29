package main

import (
	"log"

	"github.com/desotech-it/podlighter/app"
)

func main() {
	if app.IsHelp() {
		app.PrintHelp()
		return
	}
	config := app.ConfigFromFlags()
	app := app.App{
		Config: config,
	}
	if err := app.ListenAndServe(); err != nil {
		log.Fatalln(err)
	}
}
