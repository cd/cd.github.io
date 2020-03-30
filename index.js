var fs = require("fs");
var path = require('path');
var hljs = require('highlight.js');
var md = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});

const createMetaTags = (title, desc, url) => {
return `
<meta name="title" content="${title}">
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://cd.github.io/icon.png">
<meta property="twitter:card" content="summary">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${desc}">
<meta property="twitter:image" content="https://cd.github.io/icon.png">
`;
};

// Del folder
const directory = 'articles';
if (!fs.existsSync(directory)) fs.mkdirSync(directory);
fs.readdirSync(directory, (err, files) => {
  if (err) throw err;
  for (const file of files) {
    fs.unlink(path.join(directory, file), err => {
      if (err) throw err;
    });
  }
});

var blogTitle = 'Christian Diederich - Web, Engineering & More';

var optimizeHTML = function(html) {
  var newH1 =
    '      <div class="headline-wrapper">\n' +
    "        <div></div>\n" +
    "        <h1>" +
    html.split("<h1>")[1].split("</h1>")[0] +
    "</h1>\n" +
    "      </div>";
  var beforeH1 = html.split("<h1>")[0];
  var afterH1 = html.split("</h1>")[1];
  // afterH1.split("<h2>").forEach(function(el) {
    // var h2Title = el.split("</h2>")[0];"".replace()
    // var h2TitleModified = encodeURIComponent(h2Title.toLowerCase().replace(/ /g, "-"));
    // afterH1 = afterH1.replace("<h2>" + h2Title + "</h2>", '<h2><a href="#'+h2TitleModified+'">#</a> ' + h2Title + '</h2>');
  // });
  return beforeH1 + newH1 + afterH1;
};

var homeContent =
  '      <div class="headline-wrapper">\n' +
  "        <div></div>" +
  "        <h1>"+blogTitle+"</h1>\n" +
  "      </div>\n";

var layout = fs.readFileSync("./template/layout.html", "utf-8");
var indexHeader = fs.readFileSync("./template/index-header.html", "utf-8");

var articles = [];
fs.readdirSync("./articles").forEach(function(filename) {
  if (!filename.endsWith('.md')) return;
  var file = fs.readFileSync("./articles/" + filename, "utf-8");
  var date = file
    .split("\n")[0]
    .split(":")[1]
    .trim();
  if (date === 'unreleased') return;
  articles.push({
    filename: filename.split(".")[0],
    date: date,
    title: file
      .split("# ")[1]
      .split("\n")[0]
      .trim(),
    desc: md.render(file).split('<p>')[1].split('</p>')[0].replace(/<code>/g, '').replace(/<\/code>/g, ''),
    html: md.render(file).replace("<p>", '<p><span style="font-style:italic;color:gray;">(' + date + ')</span> ')
  });
});

articles.sort(function(a, b) {
  return new Date(b.date) - new Date(a.date);
});

var htmlList = '      <ul class="articles">\n';
articles.forEach(function(element) {
  htmlList +=
    '       <li><a href="articles/' +
    element.filename +
    '.html">' +
    
    element.title +
    "</a> // " +
    element.date +
    "</li>\n";
  fs.writeFileSync(
    "./articles/" + element.filename + ".html",
    optimizeHTML(
      layout
        .replace(
          "{{header}}",
          '      <a href="/"><span class="icon">&#xf104;</span> Back home</a>'
        )
        .replace("{{content}}", element.html + '<a href="/" style="text-align:center;"><span class="icon">&#xf104;</span> Back home</a>')
        .replace("{{title}}", element.title + " - " + blogTitle)
        .replace("{{meta}}", createMetaTags(element.title + ' - ' + blogTitle, element.desc, 'https://cd.github.io/articles/' + element.filename + '.html'))
    ),
    "utf-8"
  );
});
htmlList += "      </ul>";

homeContent += htmlList;

fs.writeFileSync(
  "./index.html",
  layout
    .replace("{{header}}", indexHeader)
    .replace("{{content}}", homeContent)
    .replace("{{title}}", blogTitle)
    .replace("{{meta}}", createMetaTags(blogTitle, 'A personal blog about topics like web development, engineering, machine learning, and more.', 'https://cd.github.io')),
  "utf-8"
);
