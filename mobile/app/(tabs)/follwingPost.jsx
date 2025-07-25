import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useAuthStore } from "../../store/authStore.js";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import styles from "../../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { formatPublishDate } from "../../lib/utils.js";
import COLORS from "../../assets/constants/colors.js";
import Loader from "../components/Loader.jsx";
import { useFocusEffect } from "expo-router";


export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function follwingPost() {
  const { token , user, setUser} = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
   
  // console.log(user);

  const fetchPosts = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await fetch(`http://192.168.0.100:3000/api/posts/following?page=${pageNum}&limit=2`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      // console.log(data)
      if (!response.ok) throw new Error(data.message || "Failed to fetch books");

      // todo fix it later
      // setPosts((prevPosts) => [...prevposts, ...data.posts]);

     const uniquePosts =
      refresh || pageNum === 1
    ? data.posts
    : Array.from(new Set([...posts, ...data.posts].map((post) => post._id))).map((id) =>
        [...posts, ...data.posts].find((post) => post._id === id)
      );


      setPosts(uniquePosts);

      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log("Error fetching posts", error);
    } finally {
      if (refresh) {
        await sleep(800);
        setRefreshing(false);
      } else setLoading(false);
    }
  };
  
  // useEffect(() => {
  //   fetchPosts();
  // }, []);

  useFocusEffect(
  useCallback(() => {
    fetchPosts(); // always fetch latest posts from page 1
  }, [])
);
const handleLoadMore = async () => {
  if (hasMore && !loading && !refreshing) {
    await fetchPosts(page + 1);
  }
};

const handleFollow = async (userId) => {
  try {
    const res = await fetch(`http://192.168.0.100:3000/api/user/follow/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const isFollowing = user.followings.includes(userId);

    const updatedFollowings = isFollowing ? 
         user.followings.filter(id => id !== userId)
      :  [...user.followings, userId];        

    setUser({
      ...user,
      followings: updatedFollowings,
    });

  } catch (err) {
    console.log("Follow error", err);
  }
};

const handleLike = async (postId) => {
  try {
    const res = await fetch(`http://192.168.0.100:3000/api/posts/like/${postId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const isLiked = user.likedPosts?.includes(postId);

    const updatedLikedPosts = isLiked
      ? user.likedPosts.filter(id => id !== postId) // unlike
      : [...(user.likedPosts || []), postId];       // like

    setUser({
      ...user,
      likedPosts: updatedLikedPosts,
    });
   
     setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? {
              ...post,
              likes: isLiked
                ? post.likes.filter(id => id !== user._id)  
                : [...post.likes, user._id]                
            }
          : post
      )
    );
 
  } catch (err) {
    console.log("Like error", err);
  }
};

// console.log(user);

const renderItem = ({ item }) => (
  
  <View style={styles.postCard}>
    {/* Header: Avatar + Username + Follow */}
    <View style={styles.postHeader}>
      <View style={styles.userInfo}>
        <Image
          source={item.user?.profileImage?.[0]}
          style={styles.avatar}
        />
        <Text style={styles.username}>{item.user.username}</Text>
      </View>
        {
        item.user._id !== user._id ? (
        <TouchableOpacity style={styles.followButton} onPress={() => handleFollow(item.user._id)} >

        {
          user.followings.includes(item.user._id) ?
           ( <Text style={styles.followButtonText}>Following</Text> ): 

           ( <Text style={styles.followButtonText}>Follow</Text>)
        }
        </TouchableOpacity>
        ) : (
        <Text></Text>
        )
        }
      
    </View>

    {/* Main Image */}
    <View style={styles.postImageContainer}>
      <Image source={{ uri: item.image }} style={styles.postImage} contentFit="cover" />
    </View>

    {/* Like + View */}
    <View style={styles.postDetails}>
      <View style={styles.likeRow}>
      <View>

       <TouchableOpacity 
        style={styles.likeButton}
        onPress={() => handleLike(item._id)}
      >
      {
        user?.likedPosts?.includes(item._id) ? (
          <Ionicons
          name={"heart"}
          size={20}
          color={"red"} 
        />
        ) :
        (
          <Ionicons
          name={"heart-outline"}
          size={20}
          color={COLORS.textPrimary}
        />
        )
      }
        <Text>{item.likes?.length || 0}</Text>
      </TouchableOpacity>
      </View>
        <Text style={styles.engagementText}>{item.views || 0} views</Text>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      {/* <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View> */}
      <Text style={styles.caption}>{item.caption}</Text>
      <Text style={styles.date}>Shared on {formatPublishDate(item.createdAt)}</Text>
    </View>
  </View>
);

  if (loading) return <Loader />;

  //eliminates the crash
  if (!user || !token) return <Loader />;


  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPosts(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PageMates</Text>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          </View>
        }
        ListFooterComponent={
          hasMore && posts.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} size="small" color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}