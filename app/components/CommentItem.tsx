import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Comment } from './Comments';
import { timeSince } from './VideoCard';

export default function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (c: Comment) => void;
}) {
  return (
    <View style={styles.commentOuter}>
      <View style={styles.commentContainer}>
        <Image source={{ uri: comment.avatar_url }} style={styles.avatar} />
        <View style={styles.commentBody}>
          <Text style={styles.author}>
            {comment.username || 'User'}
            <Text style={styles.time}> • {timeSince(comment.created_at)}</Text>
          </Text>
          <Text>{comment.comment}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn}>
              <FontAwesome name="thumbs-o-up" size={14} />
              {/* <Text>{comment.likes_count || ''}</Text> */}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onReply(comment)}>
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentOuter: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
  },
  commentBody: {
    flex: 1,
  },
  author: {
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    color: '#666',
    fontWeight: 'normal',
  },
  repliesContainer: {
    marginLeft: 24,
    paddingLeft: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#ddd',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyText: {
    color: '#666',
    fontSize: 12,
  },
});
