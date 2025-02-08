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


#import matplotlib
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from string import punctuation
from nltk.tokenize import RegexpTokenizer
from nltk.stem import WordNetLemmatizer
from rake_nltk import Rake 

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
print(news_articles_df.head)

print(f"Total articles collected: {len(news_articles_df)} (saved to news_articles.json)") 




# clean up data 
news_articles_df['pub_date'] = pd.to_datetime(news_articles_df['pub_date']).apply(lambda x: x.date())
print(news_articles_df.isnull().sum())

news_articles_df.dropna(inplace=True)
news_articles_df = news_articles_df[~news_articles_df['description'].isnull()]

news_articles_df['combined_text'] = news_articles_df['title'].map(str) +" "+ news_articles_df['description'].map(str) 
news_articles_df.head() 

print(news_articles_df.isnull().sum()) 

print(len(news_articles_df))


"""
# Function to remove non-ascii characters from the text
def _removeNonAscii(s): 
    return "".join(i for i in s if ord(i)<128)
# function to remove the punctuations, apostrophe, special characters using regular expressions
def clean_text(text):
    text = text.lower()
    text = re.sub(r"what's", "what is ", text)
    text = text.replace('(ap)', '')
    text = re.sub(r"\'s", " is ", text)
    text = re.sub(r"\'ve", " have ", text)
    text = re.sub(r"can't", "cannot ", text)
    text = re.sub(r"n't", " not ", text)
    text = re.sub(r"i'm", "i am ", text)
    text = re.sub(r"\'re", " are ", text)
    text = re.sub(r"\'d", " would ", text)
    text = re.sub(r"\'ll", " will ", text)
    text = re.sub(r'\W+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r"\\", "", text)
    text = re.sub(r"\'", "", text)    
    text = re.sub(r"\"", "", text)
    text = re.sub('[^a-zA-Z ?!]+', '', text)
    text = _removeNonAscii(text)
    text = text.strip()
    return text
# stop words are the words that convery little to no information about the actual content like the words:the, of, for etc
def remove_stopwords(word_tokens):
    filtered_sentence = [] 
    stop_words = stopwords.words('english')
    specific_words_list = ['char', 'u', 'hindustan', 'doj', 'washington'] 
    stop_words.extend(specific_words_list )
    for w in word_tokens: 
        if w not in stop_words: 
            filtered_sentence.append(w) 
    return filtered_sentence
# function for lemmatization 
def lemmatize(x):
    lemmatizer = WordNetLemmatizer()
    return' '.join([lemmatizer.lemmatize(word) for word in x]) 

# splitting a string, text into a list of tokens
tokenizer = RegexpTokenizer(r'\w+')
def tokenize(x): 
    return tokenizer.tokenize(x)

news_articles_df['combined_text'] = news_articles_df['combined_text'].map(clean_text)
news_articles_df['tokens'] = news_articles_df['combined_text'].map(tokenize)
news_articles_df['tokens'] = news_articles_df['tokens'].map(remove_stopwords)
news_articles_df['lems'] =news_articles_df['tokens'].map(lemmatize)

print(news_articles_df.head(n=16)) 
# finding the keywords using the rake algorithm from NLTK
# rake is Rapid Automatic Keyword Extraction algorithm, and is used for domain independent keyword extraction
news_articles_df['keywords'] = ""
for index,row in news_articles_df.iterrows():
    comb_text = row['combined_text']
    r = Rake()
    r.extract_keywords_from_text(comb_text)
    key_words_dict = r.get_word_degrees()
    row['keywords'] = list(key_words_dict.keys())
# applying the fucntion to the dataframe
news_articles_df['keywords'] = news_articles_df['keywords'].map(remove_stopwords)
news_articles_df['lems'] =news_articles_df['keywords'].map(lemmatize)

print(news_articles_df.head(n=16)) 

""" 



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

# news_articles_df.to_csv('data/news_articles_clean.csv', index = False)



for index,row in news_articles_df.iterrows(): 
    print(row['compound'])

    


import plotly.express as px  

date_sent_df = pd.DataFrame({"Date": news_articles_df['pub_date'], "Sentiment": news_articles_df['compound']}) 

date_sent_df = date_sent_df.sort_values(by='Date')

fig = px.line(date_sent_df, x="Date", y="Sentiment", markers=True, title= "News Title Senitments")
fig.show()