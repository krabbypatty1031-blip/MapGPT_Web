import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import SwipeableView from '../components/SwipeableView';
import { getPresetQuestions } from '../services/chatService';
import * as VoiceService from '../services/voiceService';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// 麦克风图标组件 - 使用提供的SVG
const MicrophoneIcon = ({ size = 24, color = '#2c2c2c' }) => (
  <Svg width={size} height={size} viewBox="0 0 1024 1024">
    <Path
      d="M512 636.540541c91.32973 0 166.054054-74.724324 166.054054-166.054055V304.432432c0-91.32973-74.724324-166.054054-166.054054-166.054054s-166.054054 74.724324-166.054054 166.054054v166.054054c0 91.32973 74.724324 166.054054 166.054054 166.054055z"
      fill={color}
    />
    <Path
      d="M484.324324 857.945946V719.567568h55.351352v138.378378h-55.351352z"
      fill={color}
    />
    <Path
      d="M608.864865 899.459459H415.135135v-55.351351h193.72973v55.351351zM788.756757 442.810811v27.675675c0 152.216216-124.540541 276.756757-276.756757 276.756757s-276.756757-124.540541-276.756757-276.756757v-27.675675h55.351352v27.675675c0 121.772973 99.632432 221.405405 221.405405 221.405406s221.405405-99.632432 221.405405-221.405406v-27.675675h55.351352z"
      fill={color}
    />
  </Svg>
);

// 键盘图标组件 - 使用提供的SVG
const KeyboardIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 1024 1024">
    <Path
      d="M898.56 256H104.576C46.912 256 0 302.848 0 360.512v334.336c0 57.6 46.848 104.512 104.512 104.512H898.56c57.6 0 104.448-46.912 104.448-104.512V360.512c0-57.6-46.848-104.512-104.448-104.512zM480.64 381.44h41.792a20.864 20.864 0 1 1 0 41.728H480.64a20.928 20.928 0 0 1 0-41.792z m0 125.312h41.792a20.864 20.864 0 1 1 0 41.792H480.64a20.928 20.928 0 0 1 0-41.792zM355.264 381.44h41.792a20.864 20.864 0 1 1 0 41.792h-41.792a20.928 20.928 0 0 1 0-41.792z m0 125.44h41.792a20.864 20.864 0 1 1 0 41.728h-41.792a20.928 20.928 0 0 1 0-41.792zM271.68 673.92h-41.792a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m0-125.44h-41.792a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m0-125.376h-41.792a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m376.128 250.816H355.264a20.928 20.928 0 0 1 0-41.792h292.544a20.864 20.864 0 1 1 0 41.792z m0-125.44H606.08a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m0-125.376H606.08a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m125.44 250.816h-41.792a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m0-125.44h-41.792a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z m0-125.376h-41.792a20.928 20.928 0 0 1 0-41.792h41.792a20.864 20.864 0 1 1 0 41.792z"
      fill={color}
    />
  </Svg>
);

// 快捷功能选项
const QUICK_ACTIONS = [
  { id: 'route', label: '路线规划' },
  { id: 'location', label: '智能找点' },
  { id: 'image', label: '拍图提问' },
  { id: 'voice', label: '语音讲解' },
];

/**
 * AI助手功能页面
 * 显示AI助手功能选项
 */
const AssistantScreen = ({ navigation }) => {

  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 防止快速连续操作
  const [selectedAction, setSelectedAction] = useState(null);
  const [messages, setMessages] = useState([]); // 对话消息列表
  const [inputText, setInputText] = useState(''); // 输入框文本
  const recordingAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);
  const presetQuestions = getPresetQuestions();

  const handleSwipeRight = () => {
    navigation.navigate('Map');
  };

  const handleQuestionPress = (question) => {
    console.log('Selected question:', question.text);
    // 发送预设问题作为用户消息
    sendMessage(question.text);
  };

  // 发送消息函数
  const sendMessage = (text) => {
    if (!text.trim()) return;
    
    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 模拟AI回复（延迟1秒）
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: `这是对"${text.trim()}"的回复。我是香港浸会大学的AI助手，很高兴为您服务！`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // 滚动到底部
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);
  };

  // 切换输入模式
  const toggleInputMode = () => {
    setInputMode(inputMode === 'text' ? 'voice' : 'text');
    setIsRecording(false);
  };

  // 开始录音
  const startRecording = async () => {
    // 防止快速连续调用
    if (isProcessing || isRecording) {
      console.log('录音正在进行中，请勿重复操作');
      return;
    }
    
    setIsProcessing(true);
    setIsRecording(true);
    
    // 开始脉冲动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // 调用语音服务开始录音
    const result = await VoiceService.startRecording();
    if (!result.success) {
      console.log('录音失败:', result.error);
      // 模拟模式 - 即使失败也继续显示录音UI
    }
    console.log('开始录音...');
  };

  // 停止录音
  const stopRecording = async () => {
    // 如果没有在录音，直接返回
    if (!isRecording) {
      return;
    }
    
    setIsRecording(false);
    recordingAnim.setValue(1);
    
    console.log('停止录音...');
    
    try {
      // 调用语音服务停止录音
      const result = await VoiceService.stopRecording();
      
      if (result.success) {
        console.log('录音成功，URI:', result.uri);
        
        // 处理语音（使用模拟数据）
        if (selectedAction) {
          console.log('处理语音，使用功能:', selectedAction);
          const voiceResult = await VoiceService.processVoiceWithAction(
            result.uri, 
            selectedAction
          );
          
          console.log('识别文本:', voiceResult.text);
          console.log('执行动作:', voiceResult.action);
          // 发送识别的文本作为消息
          sendMessage(voiceResult.text);
        } else {
          // 没有选择快捷功能，普通语音识别
          const sttResult = await VoiceService.speechToText(result.uri);
          const recognizedText = sttResult.success ? sttResult.text : sttResult.mockText;
          console.log('识别结果:', recognizedText);
          // 发送识别的文本作为消息
          sendMessage(recognizedText);
        }
      } else {
        console.log('停止录音失败:', result.error);
        // 使用模拟数据演示
        if (selectedAction) {
          console.log('使用模拟模式，功能:', selectedAction);
          const mockText = getMockTextByAction(selectedAction);
          console.log('模拟识别:', mockText);
          // 发送模拟文本作为消息
          sendMessage(mockText);
        }
      }
    } catch (error) {
      console.error('录音处理错误:', error);
    } finally {
      // 完成处理，重置状态
      setIsProcessing(false);
    }
  };

  // 根据快捷功能获取模拟文本
  const getMockTextByAction = (action) => {
    const mockTexts = {
      route: '从图书馆到食堂怎么走？',
      location: '最近的咖啡厅在哪里？',
      image: '这是什么建筑？',
      voice: '给我讲讲这个地方的历史。',
    };
    return mockTexts[action] || '你好，我想了解校园信息。';
  };

  // 选择快捷功能
  const handleActionPress = (actionId) => {
    if (selectedAction === actionId) {
      // 如果点击已选中的，则取消选择
      setSelectedAction(null);
    } else {
      // 选择新的功能
      setSelectedAction(actionId);
    }
  };

  // 主内容渲染
  const renderContent = () => (
    <LinearGradient
      colors={['#F5F7FA', '#E8EEF5']}
      style={styles.container}
    >
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>香港浸会大学</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
          {/* 有消息时隐藏头像和问候语 */}
          {messages.length === 0 && (
            <>
              {/* 🎯 机器人头像 - 使用图片 */}
              <View style={styles.avatarContainer}>
                <Image
                  source={require('../assets/title.png')}
                  style={{
                    width: 150,      // 调整这个值改变大小
                    height: 150,     // 调整这个值改变大小
                    resizeMode: 'contain'
                  }}
                />
              </View>
              {/* 🎯 问候文本 - 按照CSS规范左对齐 */}
              <View style={styles.greetingContainer}>
                <Text style={styles.helloText}>Hello~</Text>
                <Text style={styles.descriptionText}>
                  我是你的香港浸会大学<Text style={styles.highlightText}>智能AI助手</Text>
                </Text>
              </View>
            </>
          )}

          {/* 条件渲染：有消息显示对话列表，无消息显示AI记录和推荐 */}
          {messages.length > 0 ? (
            /* 对话消息列表 */
            <View style={styles.messagesContainer}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.type === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.type === 'user' ? styles.userText : styles.aiText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            /* 默认界面：AI记录和AI推荐 */
            <>
              {/* 🎯 AI记录内容 - 卡片式 */}
              <View style={styles.contentSection}>
                <View style={styles.listItem}>
                  <Text style={styles.listIcon}>✨</Text>
                  <Text style={styles.listLabel}>AI记录</Text>
                </View>

                <TouchableOpacity
                  style={styles.listItemCard}
                  onPress={() => handleQuestionPress(presetQuestions[0])}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardText}>查询香港浸会大学帮助书馆开放时间</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.listItemCard}
                  onPress={() => handleQuestionPress(presetQuestions[1])}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardText}>从学生会到教学楼A座的路线</Text>
                </TouchableOpacity>
              </View>

              {/* 🎯 AI推荐内容 - 卡片式 */}
              <View style={styles.contentSection}>
                <View style={styles.listItem}>
                  <Text style={styles.listIcon}>🔥</Text>
                  <Text style={styles.listLabel}>AI推荐</Text>
                </View>

                <TouchableOpacity style={styles.listItemCard} activeOpacity={0.7}>
                  <Text style={styles.cardText}>图书馆资源导览</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItemCard} activeOpacity={0.7}>
                  <Text style={styles.cardText}>校园美食推荐</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItemCard} activeOpacity={0.7}>
                  <Text style={styles.cardText}>运动设施介绍</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
      </ScrollView>

      {/* 🎯 固定在底部的快捷功能区 */}
      <View style={styles.quickActionsSection}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.quickActionButton,
              selectedAction === action.id && styles.quickActionButtonActive,
            ]}
            onPress={() => handleActionPress(action.id)}
          >
            <Text style={[
              styles.quickActionText,
              selectedAction === action.id && styles.quickActionTextActive
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🎯 修改后的底部输入栏 - 完全按照CSS样式 */}
      <View style={styles.inputContainerWrapper}>
        <View style={styles.inputContainer}>
          {inputMode === 'text' ? (
            <View style={styles.inputInnerRow}>
              <TouchableOpacity style={styles.micButton} onPress={toggleInputMode}>
                <MicrophoneIcon size={20} color="#666" />
              </TouchableOpacity>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="您可以问我任何问题～"
                  placeholderTextColor={theme.colors.textLight}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputInnerRow}>
              <TouchableOpacity style={styles.keyboardButton} onPress={toggleInputMode}>
                <KeyboardIcon size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.voiceInputBar}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.8}
                disabled={isProcessing && !isRecording}
              >
                {isRecording ? (
                  <View style={styles.voiceInputContent}>
                    <View style={styles.voiceWaveContainer}>
                      <View style={[styles.voiceWave, styles.voiceWave1]} />
                      <View style={[styles.voiceWave, styles.voiceWave2]} />
                      <View style={[styles.voiceWave, styles.voiceWave3]} />
                    </View>
                    <Text style={styles.voiceInputText}>正在录音...</Text>
                  </View>
                ) : (
                  <Text style={styles.voiceInputText}>按住说话</Text>
                )}
              </TouchableOpacity>
              <View style={styles.voiceButtonSpacer} />
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  // 根据是否有消息决定是否使用SwipeableView
  return messages.length > 0 ? renderContent() : (
    <SwipeableView onSwipeRight={handleSwipeRight}>
      {renderContent()}
    </SwipeableView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 36,
    color: theme.colors.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // 增加底部padding，为固定的快捷功能区留出空间
  },
  // 🎯 头像容器 - 左对齐
  avatarContainer: {
    alignItems: 'flex-start',      // 左对齐
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  // 头像图片样式
  avatarImage: {
    width: 80,
    height: 80,
  },
  // 🎯 问候语容器 - 按照CSS规范
  greetingContainer: {
    flexDirection: 'column',        // ✅ flex-direction: column
    alignItems: 'flex-start',       // ✅ align-items: flex-start
    padding: 0,                     // ✅ padding: 0px
    gap: 8,                         // ✅ gap: 8px (通过marginBottom实现)
    width: 241,                     // ✅ width: 241px
    height: 45,                     // ✅ height: 45px
    marginBottom: theme.spacing.md,
  },
  helloText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,                // gap: 8px
  },
  descriptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'left',              // 左对齐
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  contentSection: {
    marginBottom: theme.spacing.md,
  },
  // 列表式布局 - 仅用于标题
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  listIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  listLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  listContent: {
    flex: 1,
  },
  listText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  // 🎯 新增：卡片式列表项样式 - 按照CSS格式
  listItemCard: {
    flexDirection: 'row',           // ✅ flex-direction: row
    justifyContent: 'center',       // ✅ justify-content: center
    alignItems: 'center',           // ✅ align-items: center
    paddingVertical: 2,            // ✅ padding: 10px 12px
    paddingHorizontal: 12,
    height: 30,                     // ✅ height: 30px
    backgroundColor: '#FFFFFF',     // ✅ background: #FFFFFF
    borderRadius: 17,               // ✅ border-radius: 17px
    alignSelf: 'flex-start',        // 宽度自适应内容
    marginVertical: 4,              // 卡片之间的间距
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  // 消息列表样式
  messagesContainer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },
  userText: {
    color: theme.colors.white,
  },
  aiText: {
    color: theme.colors.text,
  },
  // 🎯 固定在底部的快捷功能区
  quickActionsSection: {
    position: 'absolute',           // 固定定位
    bottom: 88,                     // 距离底部的高度（在输入框上方）
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',       // 居中显示
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
    zIndex: 5,                      // 确保在其他内容之上
  },
  // 🎯 按照提供的CSS格式修改快捷按钮样式
  quickActionButton: {
    flexDirection: 'row',           // ✅ flex-direction: row
    justifyContent: 'center',       // ✅ justify-content: center
    alignItems: 'center',           // ✅ align-items: center
    paddingVertical: 8,             // ✅ padding: 8px 16px
    paddingHorizontal: 16,
    width: 78,                      // ✅ width: 88px (从70改为88)
    height: 33,                     // ✅ height: 33px
    backgroundColor: '#FFFFFF',     // ✅ background: #FFFFFF
    borderRadius: 16,               // ✅ border-radius: 16px
    shadowColor: 'rgba(6, 0, 46, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,               // ✅ box-shadow: 0px 0px 10px rgba(6, 0, 46, 0.1)
    elevation: 4,
    marginHorizontal: 5,            // 按钮之间的间距（gap: 10px的一半）
  },
  quickActionButtonActive: {
    backgroundColor: '#E8F4FD',
  },
  quickActionText: {
    fontSize: 11,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // 🎯 完全按照CSS格式的输入区域样式
  inputContainerWrapper: {
    position: 'absolute',           // 固定在底部
    bottom: 12,                     // 距离底部12px
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    zIndex: 10,                     // 确保在快捷功能区之上
  },
  inputContainer: {
    width: 355,                      // ✅ width: 355px
    height: 60,                      // ✅ height: 60px
    paddingVertical: 18,             // ✅ padding: 18px 16px
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',      // ✅ background: #FFFFFF
    borderRadius: 28,                // ✅ border-radius: 28px
    shadowColor: 'rgba(6, 0, 46, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,                // ✅ box-shadow: 0px 0px 15px rgba(6, 0, 46, 0.1)
    elevation: 8,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  // ✅ 内部横向布局容器 - 按照第二个CSS
  inputInnerRow: {
    flexDirection: 'row',             // ✅ flex-direction: row
    justifyContent: 'space-between',  // ✅ justify-content: space-between
    alignItems: 'center',             // ✅ align-items: center
    width: 323,                       // ✅ width: 323px
    height: 24,                       // ✅ height: 24px
  },
  micButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: 24,
  },
  textInput: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
    height: 24,
  },
  sendButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 语音输入相关样式
  voiceInputBar: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceWaveContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  voiceWave: {
    width: 3,
    backgroundColor: theme.colors.white,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  voiceWave1: {
    height: 12,
  },
  voiceWave2: {
    height: 20,
  },
  voiceWave3: {
    height: 16,
  },
  voiceInputText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  voiceButtonSpacer: {
    width: 24,
    height: 24,
  },
});

export default AssistantScreen;