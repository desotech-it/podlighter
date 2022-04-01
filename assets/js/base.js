window.addEventListener('load', () => {
	const yearText = document.createTextNode(new Date().getFullYear());
	const footerYear = document.getElementById('footer-year');
	footerYear.appendChild(yearText);
});
