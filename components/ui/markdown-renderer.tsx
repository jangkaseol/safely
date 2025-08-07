"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { HalluCitedChunk } from "@/lib/types";

const CitationPopover = ({
  citation,
  index,
}: {
  citation: HalluCitedChunk;
  index: number;
}) => {
  const metadata = citation.source?.metadata;
  if (!metadata) return null;

  const pageNumbers = Array.isArray(metadata.page_numbers)
    ? metadata.page_numbers.join(", ")
    : metadata.page_numbers;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="relative mx-0.5 inline-block -translate-y-1.5 align-baseline">
          <span className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 ring-1 ring-gray-300 hover:bg-gray-300">
            {index}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent className="max-w-sm" side="top" align="start">
        <div className="space-y-2 p-2">
          <p className="font-bold">
            {metadata.pdf_filename}
            {pageNumbers && (
              <span className="ml-2 font-normal text-gray-500">
                (p. {pageNumbers})
              </span>
            )}
          </p>
          <p className="text-sm">{citation.chunk_text}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const renderCitationsInString = (
  text: string,
  citedChunks: HalluCitedChunk[] | undefined
) => {
  if (!citedChunks || citedChunks.length === 0) return text;

  const regex = /\[(\d+)\]/g;
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return text;

  const result: (string | React.ReactNode)[] = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    if (match.index && match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    const index = parseInt(match[1], 10);
    if (index > 0) {
      const citationIndex = index - 1;
      if (citedChunks[citationIndex]) {
        result.push(
          <CitationPopover
            key={`${i}-${index}`}
            citation={citedChunks[citationIndex]}
            index={index}
          />
        );
      }
    }

    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length;
    }
  });

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
};

const processChildrenForCitations = (
  children: React.ReactNode,
  citedChunks: HalluCitedChunk[] | undefined
): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderCitationsInString(child, citedChunks);
    }

    if (
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      child.props.children
    ) {
      return React.cloneElement(
        child,
        { ...child.props },
        processChildrenForCitations(child.props.children, citedChunks)
      );
    }

    return child;
  });
};

interface MarkdownRendererProps {
  content: string;
  citedChunks?: HalluCitedChunk[];
  showCitationList?: boolean;
}

export default function MarkdownRenderer({
  content,
  citedChunks,
  showCitationList = true,
}: MarkdownRendererProps) {
  const customComponents = {
    h1: ({
      node,
      children,
      ...props
    }: {
      node: any;
      children: React.ReactNode;
      props: any;
    }) => (
      <h1 className="mt-6 mb-4 text-3xl font-bold" {...props}>
        {processChildrenForCitations(children, citedChunks)}
      </h1>
    ),
    h2: ({
      node,
      children,
      ...props
    }: {
      node: any;
      children: React.ReactNode;
      props: any;
    }) => (
      <h2 className="mt-5 mb-3 text-2xl font-bold" {...props}>
        {processChildrenForCitations(children, citedChunks)}
      </h2>
    ),
    h3: ({
      node,
      children,
      ...props
    }: {
      node: any;
      children: React.ReactNode;
      props: any;
    }) => (
      <h3 className="mt-4 mb-2 text-xl font-bold" {...props}>
        {processChildrenForCitations(children, citedChunks)}
      </h3>
    ),
    h4: ({
      node,
      children,
      ...props
    }: {
      node: any;
      children: React.ReactNode;
      props: any;
    }) => (
      <h4 className="mt-3 mb-2 text-lg font-bold" {...props}>
        {processChildrenForCitations(children, citedChunks)}
      </h4>
    ),
    p: ({
      node,
      children,
      ...props
    }: {
      node: any;
      children: React.ReactNode;
      props: any;
    }) => (
      <div className="mb-4" {...props}>
        {processChildrenForCitations(children, citedChunks)}
      </div>
    ),
    li: ({
      node,
      children,
      ...props
    }: {
      node: any;
      children: React.ReactNode;
      props: any;
    }) => (
      <li {...props}>{processChildrenForCitations(children, citedChunks)}</li>
    ),
  };

  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={customComponents as Components}
      >
        {content}
      </ReactMarkdown>
      {showCitationList && citedChunks && citedChunks.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <h3 className="text-sm font-semibold">참고 자료:</h3>
          {citedChunks.map((chunk, index) => {
            const metadata = chunk.source?.metadata;
            if (!metadata) return null;

            const pageNumbers = Array.isArray(metadata.page_numbers)
              ? metadata.page_numbers.join(", ")
              : metadata.page_numbers;
            return (
              <Popover key={index}>
                <PopoverTrigger asChild>
                  <span className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 ring-1 ring-gray-300 hover:bg-gray-300">
                    {index + 1}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="max-w-sm" side="top" align="start">
                  <div className="space-y-2 p-2">
                    <p className="font-bold">
                      {metadata.pdf_filename}
                      {pageNumbers && (
                        <span className="ml-2 font-normal text-gray-500">
                          (p. {pageNumbers})
                        </span>
                      )}
                    </p>
                    <p className="text-sm">{chunk.chunk_text}</p>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      )}
    </div>
  );
}
