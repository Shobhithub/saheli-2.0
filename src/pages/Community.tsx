/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Search, Send, MoreHorizontal, Heart, MessageCircle, Share2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Comment {
  _id: string;
  text: string;
  name: string;
  user: string;
  createdAt: string;
}

interface CommunityPost {
  _id: string;
  user: string;
  name: string;
  initials: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content.toLowerCase().includes(query) ||
      post.name.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;

    try {
      const res = await api.post('/posts', { content: newPost });
      setPosts([res.data, ...posts]);
      setNewPost('');
      toast({ title: 'Posted', description: 'Your update has been shared with the community.' });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to create post' });
    }
  };

  const toggleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts(posts.map(post => {
      if (post._id === postId) {
        const isLiked = post.likes.includes(user?._id || '');
        return {
          ...post,
          likes: isLiked
            ? post.likes.filter(id => id !== user?._id)
            : [user?._id || '', ...post.likes]
        };
      }
      return post;
    }));

    try {
      await api.put(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/posts/${postId}/comment`, { text: newComment });
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data } : p));
      setNewComment('');
      toast({ title: 'Comment Added' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Format relative time (e.g. "2 min ago")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <CitizenLayout title="Community">
      <div className="flex-1 flex flex-col pb-20">
        {/* Search Bar */}
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts by content or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 rounded-xl bg-muted/50 border-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* New Post Input */}
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary-foreground">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Share something with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="flex-1 h-10 rounded-xl bg-muted/50 border-0"
                onKeyDown={(e) => e.key === 'Enter' && handlePost()}
              />
              <Button
                variant="coral"
                size="icon"
                className="rounded-xl shrink-0"
                onClick={handlePost}
                disabled={!newPost.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            filteredPosts.map((post) => (
              <article
                key={post._id}
                className="px-4 py-4 border-b border-border bg-card animate-slide-in-up"
              >
                {/* Post Header */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-secondary text-secondary-foreground"
                  )}>
                    <span className="text-sm font-semibold">
                      {post.initials}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground">{post.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">· {formatTime(post.createdAt)}</span>
                      </div>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    <p className="text-foreground text-sm mt-2 whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 mt-3">
                      <button
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => toggleLike(post._id)}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            post.likes.includes(user?._id || '') && "fill-primary text-primary"
                          )}
                        />
                        <span className="text-xs">{post.likes.length}</span>
                      </button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">{post.comments.length}</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Comments</DialogTitle>
                          </DialogHeader>

                          <div className="flex-1 overflow-y-auto space-y-4 py-4">
                            {post.comments.length === 0 ? (
                              <p className="text-center text-muted-foreground text-sm">No comments yet. Be the first!</p>
                            ) : (
                              post.comments.map((comment, idx) => (
                                <div key={idx} className="flex gap-3 text-sm">
                                  <div className="font-semibold">{comment.name}:</div>
                                  <div className="text-muted-foreground flex-1">{comment.text}</div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Input
                              placeholder="Write a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleComment(post._id);
                                }
                              }}
                            />
                            <Button size="icon" onClick={() => handleComment(post._id)}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </CitizenLayout>
  );
}
