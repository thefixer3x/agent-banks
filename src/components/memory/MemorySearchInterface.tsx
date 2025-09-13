
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchResult } from "@/types/memory";
import { Eye, ExternalLink, Tag, Calendar, TrendingUp } from "lucide-react";

interface MemorySearchInterfaceProps {
  searchResults: SearchResult[];
}

export function MemorySearchInterface({ searchResults }: MemorySearchInterfaceProps) {
  if (searchResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Search Results</h3>
          <p className="text-muted-foreground">
            Try adjusting your search query or filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Search Results</h2>
        <p className="text-muted-foreground">
          Found {searchResults.length} matching memories
        </p>
      </div>

      <div className="space-y-4">
        {searchResults.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{result.title}</h3>
                    <p className="text-muted-foreground line-clamp-3 mb-3">
                      {result.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline" className="font-mono text-xs">
                      {Math.round(result.similarity * 100)}% match
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {result.summary && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{result.memory_type}</Badge>
                  {result.topic_name && (
                    <Badge variant="outline">{result.topic_name}</Badge>
                  )}
                  {result.project_ref !== 'general' && (
                    <Badge variant="outline">{result.project_ref}</Badge>
                  )}
                </div>

                {result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.tags.slice(0, 5).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {result.tags.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{result.tags.length - 5}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(result.updated_at).toLocaleDateString()}
                    </div>
                    <div>
                      Accessed {result.access_count} times
                    </div>
                    <div>
                      Relevance: {result.relevance_score.toFixed(1)}
                    </div>
                  </div>
                  {result.source_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => window.open(result.source_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Source
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
