url = 'https://newsapi.org/v2/everything?'
api_key = '69f6a21ecae74568bfbe666f226be8a1' 

# API raw data to dictionary 
def get_articles(file): 
    article_results = [] 
    for i in range(len(file)):
        article_dict = {}
        article_dict['title'] = file[i]['title']
        article_dict['source'] = file[i]['source']
        article_dict['description'] = file[i]['description']
        article_dict['content'] = file[i]['content']
        article_dict['pub_date'] = file[i]['publishedAt']
        article_dict['url'] = file[i]["url"]
        article_results.append(article_dict)
    return article_results


# key words: transgender, trans, nonbinary, gender, legistlation, policy, laws, Trump, administration 
# sources: bbc.com, abcnews.go.com,  

parameters_headlines = {
    'q': 'trans OR transgender',
    'sortBy':'publishedAt',
    'pageSize': 100,
    'apiKey': api_key,
    'language': 'en',
    'sources': "bbc.com, "
}