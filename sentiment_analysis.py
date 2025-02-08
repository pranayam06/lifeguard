import requests
import pandas as pd

url = 'https://newsapi.org/v2/everything?'
api_key = '69f6a21ecae74568bfbe666f226be8a1'

def get_articles(file): 
    article_results = [] 
    for i in range(len(file)):
        article_dict = {
            'title': file[i].get('title', 'N/A'),
            'author': file[i].get('author', 'N/A'),
            'source': file[i]['source'].get('name', 'N/A'),
            'description': file[i].get('description', 'N/A'),
            'content': file[i].get('content', 'N/A'),
            'pub_date': file[i].get('publishedAt', 'N/A'),
            'url': file[i].get("url", 'N/A'),
            'photo_url': file[i].get('urlToImage', 'N/A')
        }
        article_results.append(article_dict)
    return article_results

parameters_headlines = {
    'q': 'trans OR transgender',
    'sortBy': 'publishedAt',
    'pageSize': 100,
    'apiKey': api_key,
    'language': 'en',
    'sources': 'bbc-news, abc-news'
}

response = requests.get(url, params=parameters_headlines)
response_json_headline = response.json()

if response_json_headline.get("status") != "ok":
    print("API Error:", response_json_headline.get("message", "Unknown error"))
else:
    if "articles" in response_json_headline:
        responses = response_json_headline["articles"]
        news_articles_df = pd.DataFrame(get_articles(responses))
        print(news_articles_df.head())
    else:
        print("No articles found:", response_json_headline)