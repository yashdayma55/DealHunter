export interface RedditPost {
  id: string;
  title: string;
  author: string;
  permalink: string;
  url: string;
  created_utc: number;
  ups: number;
  num_comments: number;
  selftext?: string;
  link_flair_text?: string; // <--- ADD THIS
}