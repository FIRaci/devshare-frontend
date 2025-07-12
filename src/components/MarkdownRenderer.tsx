'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Text, Heading, Code, UnorderedList, OrderedList, ListItem, Link, Image } from '@chakra-ui/react';

const chakraComponents = {
  h1: (props: any) => <Heading as="h1" size="xl" my={4} {...props} />,
  h2: (props: any) => <Heading as="h2" size="lg" my={3} {...props} />,
  h3: (props: any) => <Heading as="h3" size="md" my={2} {...props} />,
  p: (props: any) => {
    // Sửa lỗi: Không render thẻ p rỗng nếu bên trong là ảnh
    const isImg = props.children[0]?.props?.src;
    return isImg ? <>{props.children}</> : <Text my={2} {...props} />;
  },
  // SỬA LỖI: Thêm custom component cho ảnh
  img: (props: any) => {
    return <Image src={props.src} alt={props.alt} borderRadius="md" my={4} maxW="100%" />;
  },
  code: (props: any) => {
    const { inline, className, children } = props;
    const match = /language-(\w+)/.exec(className || '');
    if (inline) {
      return <Code colorScheme="yellow" fontSize="sm" {...props} />;
    }
    return (
      <Box as="pre" p={4} bg="gray.800" color="white" borderRadius="md" my={4} overflowX="auto">
        <code>{children}</code>
      </Box>
    );
  },
  ul: (props: any) => <UnorderedList my={4} ml={6} {...props} />,
  ol: (props: any) => <OrderedList my={4} ml={6} {...props} />,
  li: (props: any) => <ListItem {...props} />,
  a: (props: any) => <Link color="blue.500" isExternal {...props} />,
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown components={chakraComponents} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
