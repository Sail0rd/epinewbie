"use strict";

require('dotenv').config()

const cheerio = require('cheerio')
const fetch = require('node-fetch');

async function fetchUrl(url)
{
    let response = await fetch(url);
    let body = await response.text();
    return body;
}

function handle_news(value, $){
    const news= {
        title: "",
        author: "",
        newsgroup: "",
        tags: [],
        content: "",
        link: "",
    };
    news.link = process.env.URL + '/?news=' + $(value).attr('id');
    news.title = $('div[class=news-title]').text().match(/\n                        (.*)\n/)[1];
    news.author = $('div[class=news-author]').text().match(/([A-Za-z ]+) - ([a-za-z0-9\.]+)/)[1];
    news.newsgroup = $('div[class=news-author]').text().match(/([A-Za-z ]+) - ([a-za-z0-9\.]+)/)[2];
    let tags = $('div[class=news-tags]').children();
    tags.each(function(index, value){
        news.tags.push($(value).text());
    });
    news.content = $('div[class=news-body]').text();
    return news;
}

/**
    * @brief function that fetch all the news and process them
    *
    * @param newsgroup the name of the newsgroup needed, fetch all newsgroup if blank 
    *
    * @return array of news objects
    */
async function getnews(newsgroup = "") {
    let ret = [];
    let data = await fetchUrl(process.env.URL);
    let $ = cheerio.load(data);
    let news = $('a[class=news]'); 
    news.each(async function(index, value) {
        $ = cheerio.load(value)
        if (newsgroup === "")
            ret.push(handle_news(value, $));
        else if  ($('div[class=news-author]').text().match(/([a-za-z ]+) - ([a-za-z0-9\.]+)/)[2] === newsgroup) {
            ret.push(handle_news(value, $));
        }
    });

    // Wait for all of the promises in the ret array to resolve
    let resolvedValues = await Promise.all(ret);
    return resolvedValues;

    // Build the formatted string using the resolved values
    // let result = [];
    // resolvedValues.forEach(elt => {
        // result.push(`[lien vers la news](${elt.link})\n>>> ${elt.title}\n${elt.author} - ${elt.newsgroup}\n${elt.content}\n`);
    // });

    // return result;
}

async function getngnames(){
    let names = [];
    let $ = cheerio.load(await fetchUrl(process.env.URL))
    let data = $('div[class=news-author]')
    data.each(function(index, value){
        names.push($(value).text().match(/([A-Za-z ]+) - ([a-za-z0-9\.]+)/)[2]);
    });
    let unique = [...new Set(names)];
    return unique
}

module.exports = {
    getnews,
    getngnames,
};
