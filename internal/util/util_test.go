package util_test

import (
	"testing"

	. "github.com/desotech-it/podlighter/internal/util"
)

func TestIndexOfString(t *testing.T) {
	emptyHaystack := []string{}
	haystack := []string{"test0", "test1"}

	t.Run("EmptySlice", func(t *testing.T) {
		needle := "test"
		got := IndexOfString(emptyHaystack, needle)
		want := -1
		if got != want {
			t.Errorf("got IndexOfString(%v, %q) = %d; want %d", emptyHaystack, needle, got, want)
		}
	})

	t.Run("Present", func(t *testing.T) {
		needle := "test1"
		got := IndexOfString(haystack, needle)
		want := 1
		if got != want {
			t.Errorf("got IndexOfString(%v, %q) = %d; want %d", haystack, needle, got, want)
		}
	})

	t.Run("NotPresent", func(t *testing.T) {
		needle := "test2"
		got := IndexOfString(haystack, needle)
		want := -1
		if got != want {
			t.Errorf("got IndexOfString(%v, %q) = %d; want %d", haystack, needle, got, want)
		}
	})
}
