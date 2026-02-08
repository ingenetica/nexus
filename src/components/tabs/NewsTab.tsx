import React, { useEffect, useState } from 'react'
import { useNewsStore } from '../../stores/newsStore'
import { usePublishStore } from '../../stores/publishStore'
import { NewsCard } from '../news/NewsCard'
import { SourceManager } from '../news/SourceManager'
import { NewsFilter } from '../news/NewsFilter'
import { PostComposer } from '../publish/PostComposer'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import { Article, SocialPlatform } from '../../lib/types'

export const NewsTab: React.FC = () => {
  const {
    sources, articles, loading, scraping,
    searchQuery, selectedSourceId, minScore, savedOnly,
    generatingForArticle, generatedPost, generationError, generatedPlatform,
    setSearchQuery, setSelectedSourceId, setMinScore, setSavedOnly,
    loadSources, loadArticles, addSource, deleteSource, toggleSource, toggleSaved, scrapeAll,
    generatePost, clearGeneratedPost,
  } = useNewsStore()
  const { createPost, loadAccounts } = usePublishStore()

  const [showComposer, setShowComposer] = useState(false)

  useEffect(() => {
    loadSources()
    loadArticles()
    loadAccounts()
  }, [])

  useEffect(() => {
    loadArticles()
  }, [searchQuery, selectedSourceId, minScore, savedOnly])

  // Open composer when generation completes
  useEffect(() => {
    if (generatedPost) {
      setShowComposer(true)
    }
  }, [generatedPost])

  const handleCreatePost = (article: Article, platform: SocialPlatform) => {
    generatePost(article.id, platform)
  }

  const handleSaveComposed = (content: string, hashtags: string, platform?: SocialPlatform) => {
    createPost({
      article_id: generatedPost?.articleId || null,
      platform: platform || generatedPlatform || 'linkedin',
      content,
      hashtags,
      status: 'draft',
    })
    setShowComposer(false)
    clearGeneratedPost()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nexus-text-primary">News Discovery</h1>
          <p className="text-sm text-nexus-text-secondary mt-1">Discover and curate news for social media content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={scrapeAll} disabled={scraping}>
            {scraping ? <><Spinner size="sm" /> Scraping...</> : 'Scrape All Sources'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <SourceManager
              sources={sources}
              onAdd={addSource}
              onDelete={deleteSource}
              onToggle={toggleSource}
            />
          </Card>
        </div>
        <div className="col-span-2 space-y-4">
          <NewsFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSourceId={selectedSourceId}
            onSourceChange={setSelectedSourceId}
            minScore={minScore}
            onMinScoreChange={setMinScore}
            savedOnly={savedOnly}
            onSavedOnlyChange={setSavedOnly}
            sources={sources}
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-nexus-text-secondary">
              <p className="text-lg mb-2">No articles found</p>
              <p className="text-sm">Add some sources and scrape them to discover news</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(article => (
                <NewsCard
                  key={article.id}
                  article={article}
                  generating={generatingForArticle === article.id}
                  onCreatePost={handleCreatePost}
                  onToggleSaved={(a) => toggleSaved(a.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showComposer && !!generatedPost} onClose={() => { setShowComposer(false); clearGeneratedPost() }} title={`Edit Generated Post (${generatedPlatform || 'linkedin'})`}>
        <PostComposer
          initialContent={generatedPost?.content || ''}
          initialHashtags={generatedPost?.hashtags || ''}
          platform={generatedPlatform || 'linkedin'}
          onSave={(content, hashtags) => handleSaveComposed(content, hashtags)}
          onCancel={() => { setShowComposer(false); clearGeneratedPost() }}
        />
      </Modal>

      <Modal open={!!generationError} onClose={() => clearGeneratedPost()} title="Generation Error">
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{generationError}</p>
          </div>
          <Button size="sm" onClick={() => clearGeneratedPost()}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}
