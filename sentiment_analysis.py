import os
import requests
import pandas as pd 
import re 
import json
import numpy as np
import nltk
nltk.download('stopwords') 
nltk.download('wordnet')  
nltk.download('punkt_tab')   

from nltk.sentiment import SentimentIntensityAnalyzer 
from tqdm.notebook import tqdm 
nltk.download('vader_lexicon')



# Load API Key from environment variable (for security)
#api_key = os.getenv('NEWSAPI_KEY')  # Set this in your system environment

api_key = "b77bfc225b154985b103e81c698ef753"

if not api_key:
    raise ValueError("API Key is missing. Set NEWSAPI_KEY as an environment variable.")

url = 'https://newsapi.org/v2/everything?'

def get_articles(file): 
    """Extracts relevant fields from API response."""
    return [
        {
            'title': article.get('title', 'N/A'),
            'source': article['source'].get('name', 'N/A'),
            'description': article.get('description', 'N/A'),
            'pub_date': article.get('publishedAt', 'N/A'),
            'url': article.get("url", 'N/A'),
        }
        for article in file
    ]

responses = []  # Stores all responses
domains = [
    'bbc.com', 'apnews.com', 'washingtonpost.com'
]

for domain in domains: 
    parameters_headlines = { 
        'domains': domain,
        'q': 'trans OR transgender',
        'sortBy': 'publishedAt',
        'pageSize': 10,  # Reduced to avoid API limits
        'apiKey': api_key,
        'language': 'en',
    }
    
    try:
        response = requests.get(url, params=parameters_headlines)
        response.raise_for_status()  # Raise HTTP errors
        
        response_json = response.json()
        if "articles" in response_json:
            responses.extend(response_json["articles"])  # Append articles, don't overwrite
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch news from {domain}: {e}")

# Convert to DataFrame
news_articles_df = pd.DataFrame(get_articles(responses))

 
 # Save to JSON file
news_articles_df.to_json("news_articles.json", orient="records", indent=4) 


print(f"Total articles collected: {len(news_articles_df)} (saved to news_articles.json)") 




# clean up data 
news_articles_df['pub_date'] = pd.to_datetime(news_articles_df['pub_date']).apply(lambda x: x.date())


news_articles_df.dropna(inplace=True)
news_articles_df = news_articles_df[~news_articles_df['description'].isnull()]

news_articles_df['combined_text'] = news_articles_df['title'].map(str) +" "+ news_articles_df['description'].map(str) 
news_articles_df.head() 



sia = SentimentIntensityAnalyzer() 



news_articles_df['compound'] = 0.0
news_articles_df['pos'] = 0.0
news_articles_df['neg'] = 0.0
news_articles_df['neu'] = 0.0

# Compute sentiment scores
for index, row in news_articles_df.iterrows():
    comb_text = row['combined_text']
    sentiment_scores = sia.polarity_scores(comb_text)
    
    # Correctly assign values to the DataFrame
    news_articles_df.at[index, 'compound'] = sentiment_scores['compound']
    news_articles_df.at[index, 'pos'] = sentiment_scores['pos']
    news_articles_df.at[index, 'neg'] = sentiment_scores['neg']
    news_articles_df.at[index, 'neu'] = sentiment_scores['neu']


import plotly.express as px  

date_sent_df = pd.DataFrame({"Date": news_articles_df['pub_date'], "Sentiment": news_articles_df['compound']}) 

date_sent_df = date_sent_df.sort_values(by='Date')

fig = px.line(date_sent_df, x="Date", y="Sentiment", markers=True, title= "News Title Senitments")
fig.show() 
mean_source = {}

for index, row in news_articles_df.iterrows(): 
    if row["source"] not in mean_source:   
        mean_source[row["source"]] = [row["compound"]]  # Initialize list
    else:
        mean_source[row["source"]].append(row["compound"])  # Append to list

# Compute the average sentiment per source
mean_source_avg = {source: sum(values) / len(values) for source, values in mean_source.items()}

# Convert to DataFrame
source_sent_avg_df = pd.DataFrame(list(mean_source_avg.items()), columns=['Source', 'Average Sentiment'])

# Plot using Plotly
fig = px.bar(source_sent_avg_df, x='Average Sentiment', y='Source', title="Average Sentiment by Source") 
fig.update_layout(xaxis_range=[-1,1])
fig.show()