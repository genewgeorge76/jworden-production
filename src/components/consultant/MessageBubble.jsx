import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={cn('max-w-[80%]', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-muted border border-border text-foreground'
            : 'bg-card border border-border text-foreground'
        )}>
          {isUser ? (
            <p className="font-body">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="font-body prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {message.role === 'assistant' && (
          <p className="font-display text-muted-foreground text-xs tracking-wider uppercase mt-1.5 ml-1">
            Worden Consultant
          </p>
        )}
      </div>
    </div>
  );
}
