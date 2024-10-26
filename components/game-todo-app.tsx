// 'use client'を宣言して、クライアントサイドでのレンダリングを有効にする
'use client'

// 必要なReactフックとライブラリをインポート
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Trash2, X, GripVertical, Lock, Home, Dice5, Users, BarChart2, Send, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { generateCharacterResponse } from '@/app/gemini'

// Todoの型を定義
interface Todo {
  id: number
  text: string
  completed: boolean
  isEditing: boolean
  hasAwardedExp: boolean
  completedAt?: Date
}

// キャラクターの型を定義
interface Character {
  id: string
  name: string
  image: string
  description: string
}

// 実績の型を定義
interface Achievement {
  id: string
  name: string
  description: string
  condition: (gameState: GameState) => boolean
  reward: number
  completed: boolean
  claimed: boolean
}

// ゲームの状態を定義
interface GameState {
  level: number
  exp: number
  expToNextLevel: number
  characters: Character[]
  currentCharacter: Character
  gachaStones: number
  completedTasks: number
  achievements: Achievement[]
  gachaCount: number
}

// 全キャラクターのリストを定義
const allCharacters: Character[] = [
  { id: 'chick', name: 'ひよこ', image: '/images/characters/chick.png', description: 'かわいいひよこです。一生懸命頑張ります！' },
  { id: 'bear', name: 'クマ', image: '/images/characters/bear.png', description: 'のんびり屋のクマです。ゆっくり確実に物事を進めます。' },
  { id: 'penguin', name: 'ペンギン', image: '/images/characters/penguin.png', description: '寒さに強いペンギンです。困難にも負けません！' },
  { id: 'rabbit', name: 'ウサギ', image: '/images/characters/rabbit.png', description: '小さくてかわいいウサギです。素早く動き回ります！' },
  { id: 'panther', name: 'パンサー', image: '/images/characters/panther.png', description: '強くて勇敢なパンサーです。困難な課題も乗り越えます。' },
  { id: 'seal', name: 'アザラシ', image: '/images/characters/seal.png', description: 'のんびり屋のアザラシです。ストレスに強く、穏やかに過ごします。' },
  { id: 'pomeranian', name: 'ポメラニアン', image: '/images/characters/pomeranian.png', description: 'ふわふわで愛らしいポメラニアンです。元気いっぱいで、あなたを励まします！' },
  { id: 'shimaenaga', name: 'シマエナガ', image: '/images/characters/shimaenaga.png', description: '可愛らしいシマエナガです。小さな体に大きな知恵を持っています。' },
  { id: 'mike', name: 'ミケ', image: '/images/characters/mike.png', description: '三毛猫のミケです。好奇心旺盛で、あなたの冒険を見守ります。' },
  { id: 'shiba', name: '柴犬', image: '/images/characters/shiba.png', description: '忠実で勇敢な柴犬です。困難な時もあなたと一緒に乗り越えます。' },
]

// 初期実績を定義
const initialAchievements: Achievement[] = [
  // タスク完了数関連
  {
    id: 'first-task',
    name: '初めてのタスク',
    description: '最初のタスクを完了する',
    condition: (gameState: GameState) => gameState.completedTasks >= 1,
    reward: 5,
    completed: false,
    claimed: false
  },
  {
    id: 'task-master-10',
    name: 'タスクマスター初級',
    description: '10個のタスクを完了する',
    condition: (gameState: GameState) => gameState.completedTasks >= 10,
    reward: 20,
    completed: false,
    claimed: false
  },
  {
    id: 'task-master-50',
    name: 'タスクマスター中級',
    description: '50個のタスクを完了する',
    condition: (gameState: GameState) => gameState.completedTasks >= 50,
    reward: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'task-master-100',
    name: 'タスクマスター上級',
    description: '100個のタスクを完了する',
    condition: (gameState: GameState) => gameState.completedTasks >= 100,
    reward: 100,
    completed: false,
    claimed: false
  },

  // レベル関連
  {
    id: 'first-level-up',
    name: '初めてのレベルアップ',
    description: 'レベル2に到達する',
    condition: (gameState: GameState) => gameState.level >= 2,
    reward: 10,
    completed: false,
    claimed: false
  },
  {
    id: 'level-5',
    name: '中級冒険者',
    description: 'レベル5に到達する',
    condition: (gameState: GameState) => gameState.level >= 5,
    reward: 30,
    completed: false,
    claimed: false
  },
  {
    id: 'level-10',
    name: '上級冒険者',
    description: 'レベル10に到達する',
    condition: (gameState: GameState) => gameState.level >= 10,
    reward: 100,
    completed: false,
    claimed: false
  },

  // キャラクター収集関連
  {
    id: 'first-character',
    name: '初めての仲間',
    description: '2体目のキャラクターを獲得する',
    condition: (gameState: GameState) => gameState.characters.length >= 2,
    reward: 15,
    completed: false,
    claimed: false
  },
  {
    id: 'character-collector-5',
    name: 'コレクター見習い',
    description: '5体のキャラクターを集める',
    condition: (gameState: GameState) => gameState.characters.length >= 5,
    reward: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'character-collector-all',
    name: 'マスターコレクター',
    description: '全てのキャラクターを集める',
    condition: (gameState: GameState) => gameState.characters.length >= allCharacters.length,
    reward: 200,
    completed: false,
    claimed: false
  },

  // ガチャ関連
  {
    id: 'first-gacha',
    name: '初めてのガチャ',
    description: '初めてガチャを引く',
    condition: (gameState: GameState) => gameState.gachaCount >= 1,
    reward: 10,
    completed: false,
    claimed: false
  },
  {
    id: 'gacha-10',
    name: 'ガチャ中毒',
    description: 'ガチャを10回引く',
    condition: (gameState: GameState) => gameState.gachaCount >= 10,
    reward: 30,
    completed: false,
    claimed: false
  },
  {
    id: 'gacha-50',
    name: 'ガチャの王',
    description: 'ガチャを50回引く',
    condition: (gameState: GameState) => gameState.gachaCount >= 50,
    reward: 150,
    completed: false,
    claimed: false
  }
]

// モーダルコンポーネントを定義
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg relative w-full max-w-[90%] mx-auto max-h-[90%] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

// ステータスバーコンポーネントを定義
const StatusBar = ({ gameState }: { gameState: GameState }) => (
  <div className="w-full flex justify-between items-center mb-4">
    <div className="w-16 h-16 relative">
      <CircularProgressbar
        value={(gameState.exp / gameState.expToNextLevel) * 100}
        strokeWidth={8}
        styles={buildStyles({
          pathColor: 'hsl(var(--primary))',
          trailColor: 'hsl(var(--muted))',
        })}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-lg font-bold">Lv.{gameState.level}</p>
      </div>
    </div>
    <div className="flex items-center bg-muted px-2 py-1 rounded-full">
      <span className="text-sm mr-1">💎</span>
      <span className="text-lg font-semibold">{gameState.gachaStones}</span>
    </div>
  </div>
)

// キャラクターページコンポーネントを定義
const CharacterPage = memo(({ 
  gameState, 
  characterMessage,
  userMessage,
  chatInput,
  setChatInput,
  handleChatSubmit,
  isAnimating
}: {
  gameState: GameState
  characterMessage: string
  userMessage: string
  chatInput: string
  setChatInput: (value: string) => void
  handleChatSubmit: (e: React.FormEvent) => void
  isAnimating: boolean
}) => (
  <div className="flex flex-col h-full relative px-4">
  <StatusBar gameState={gameState} />
  <div className="flex-grow relative">
    <div className="absolute inset-0 flex items-center justify-center">
      <img
        src={gameState.currentCharacter.image}
        alt={`${gameState.currentCharacter.name}キャラクター`}
        className={`w-48 h-48 object-contain ${isAnimating ? 'animate-talking' : ''}`}
      />
    </div>
    {characterMessage && (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-xs bg-white border border-gray-200 rounded-lg p-4 shadow-lg z-10">
        <p className="text-sm whitespace-pre-line text-center">{characterMessage}</p>
      </div>
    )}
    {userMessage && (
      <div className="absolute bottom-4 right-4 max-w-xs">
        <span className="inline-block p-2 rounded-lg bg-primary text-primary-foreground">
          {userMessage}
        </span>
      </div>
    )}
  </div>
  <div className="mt-4 mb-8">
    <form onSubmit={handleChatSubmit} className="flex items-center space-x-2">
      <Input
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value.slice(0, 100))}
        placeholder={`${gameState.currentCharacter.name}と会話する...`}
        className="flex-grow"
        autoComplete="off"
        maxLength={100}
      />
      <Button type="submit" size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
    <div className="text-xs text-gray-500 mt-1 text-right">
      {chatInput.length}/100文字
    </div>
  </div>
</div>
));

// キャラクターリストページコンポーネントを定義
const CharacterListPage = memo(({ 
  gameState, 
  selectedCharacter,
  setSelectedCharacter, 
  isCharacterDetailModalOpen,
  setIsCharacterDetailModalOpen,
  changeCurrentCharacter
}: {
  gameState: GameState
  selectedCharacter: Character | null
  setSelectedCharacter: (character: Character) => void
  isCharacterDetailModalOpen: boolean
  setIsCharacterDetailModalOpen: (isOpen: boolean) => void
  changeCurrentCharacter: (character: Character) => void
}) => {
  // コンプリート率を計算
  const completionRate = calculateCompletionRate(gameState.characters, allCharacters);
  
  return (
    <div className="flex flex-col items-center justify-between h-full relative overflow-hidden px-4">
      <StatusBar gameState={gameState} />
      <div className="w-full text-right mb-4">
        <p className="text-sm font-medium">
          コンプリート率：{completionRate}%</p>
      </div>
      <div className="flex-grow flex flex-col items-center w-full max-w-md overflow-hidden">
        <div className="grid grid-cols-2 gap-4 w-full h-[calc(100vh-200px)] overflow-y-auto px-4">
          {allCharacters.map((character) => {
            const isOwned = gameState.characters.some(owned => owned.id === character.id)
            return (
              <div
                key={character.id}
                className={`flex flex-col items-center p-4 bg-muted rounded-lg ${isOwned ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                onClick={() => {
                  if (isOwned) {
                    setSelectedCharacter(character)
                    setIsCharacterDetailModalOpen(true)
                  }
                }}
              >
                <div className="relative w-24 h-24 mb-2">
                  {isOwned ? (
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
                      <Lock className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium">
                  {isOwned ? character.name : '???'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      <Modal isOpen={isCharacterDetailModalOpen} onClose={() => setIsCharacterDetailModalOpen(false)}>
          {selectedCharacter && (
            <div className="flex flex-col items-center">
              <img
                
                src={selectedCharacter.image}
                alt={`${selectedCharacter.name}キャラクター`}
                className="w-24 h-24 object-contain mb-2"
              />
              <h3 className="text-lg font-semibold mb-1">{selectedCharacter.name}</h3>
              <p className="text-xs text-muted-foreground mb-2 text-center">
                {selectedCharacter.description}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  if (selectedCharacter) {
                    changeCurrentCharacter(selectedCharacter)
                    setIsCharacterDetailModalOpen(false)
                  }
                }}
              >
                このキャラクターを選択
              </Button>
            </div>
          )}
        </Modal>
    </div>
  );
});

// 所有キャラクターのコンプリート率を計算する関数
const calculateCompletionRate = (ownedCharacters: Character[], totalCharacters: Character[]) => {
  const uniqueOwnedCharacters = new Set(ownedCharacters.map(char => char.id));
  return Math.round((uniqueOwnedCharacters.size / totalCharacters.length) * 100);
};

// 実績ページコンポーネントを定義
const AchievementsPage = memo(({ gameState, claimAchievement }: { gameState: GameState; claimAchievement: (achievementId: string) => void }) => {
  // 未受取の実績数を計算
  const unclaimedCount = gameState.achievements.filter(
    achievement => achievement.completed && !achievement.claimed
  ).length;

  return (
    <div className="flex flex-col items-center justify-between h-full relative px-4">
      <StatusBar gameState={gameState} />
      <div className="flex-grow flex flex-col items-center w-full max-w-md overflow-hidden">
        <div className="w-full text-right mb-4">
          <p className="text-sm text-muted-foreground">
            未受取の報酬：{unclaimedCount}個
          </p>
        </div>
        <div className="w-full h-[calc(100vh-200px)] overflow-y-auto px-4">
          {gameState.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center justify-between p-4 mb-4 rounded-lg ${
                achievement.completed ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              <div>
                <h4 className="font-semibold">{achievement.name}</h4>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
              <div className="flex items-center">
                {achievement.completed ? (
                  achievement.claimed ? (
                    <div className="w-20 text-center">
                      <span className="text-sm font-medium text-muted-foreground">受取済</span>
                    </div>
                  ) : (
                    <Button onClick={() => claimAchievement(achievement.id)} size="sm" className="w-20">
                      💎 {achievement.reward}
                    </Button>
                  )
                ) : (
                  <Button disabled size="sm" className="w-20">
                    💎 {achievement.reward}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ゲームTodoアプリのメインコンポーネントを定義
export default function GameTodoApp() {
  // ステートを定義
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    characters: [allCharacters[0]],
    currentCharacter: allCharacters[0],
    gachaStones: 1000,
    completedTasks: 0,
    achievements: initialAchievements,
    gachaCount: 0,
  })
  const [showCompleted, setShowCompleted] = useState(false)
  const [currentPage, setCurrentPage] = useState<'character' | 'gacha' | 'characterList' | 'report' | 'achievements'>('character')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [characterMessage, setCharacterMessage] = useState("今日も一緒に頑張ろう！");
  const [isGachaModalOpen, setIsGachaModalOpen] = useState(false)
  const [isCharacterDetailModalOpen, setIsCharacterDetailModalOpen] = useState(false)
  const [isThinking, setIsThinking] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null)
  const [chatInput, setChatInput] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [isAnimating, setIsAnimating] = useState(false);
  const isComposingRef = useRef(false);

  // アニメーションを開始する関数
  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 5000);
  };

  // 新しいTodoを追加する関数
  const addTodo = () => {
    if (newTodo.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false, isEditing: false, hasAwardedExp: false }])
      setNewTodo('')
      showCharacterMessage('新しいタスクを頑張ろう！')
      startAnimation();
    }
  }

  // Todoの完了状態を切り替える関数
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const newCompleted = !todo.completed
        if (newCompleted && !todo.hasAwardedExp) {
          addExp(20)
          addGachaStone(1)
          updateCompletedTasks(1)
          showCharacterMessage('タスク完了！\nよくがんばったね！')
          startAnimation();
          return { ...todo, completed: newCompleted, hasAwardedExp: true, completedAt: new Date() }
        }
        return { ...todo, completed: newCompleted }
      }
      return todo
    }))
  }

  // Todoを削除する関数
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // Todoの編集を開始する関数
  const startEditing = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, isEditing: true } : { ...todo, isEditing: false }
    ))
  }

  // Todoの編集を停止する関数
  const stopEditing = (id: number, newText?: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, isEditing: false, text: newText !== undefined ? newText : todo.text }
        : todo
    ))
  }

  // 経験値を追加する関数
  const addExp = (amount: number) => {
    setGameState(prev => {
      const newExp = prev.exp + amount
      if (newExp >= prev.expToNextLevel) {
        showCharacterMessage('レベルアップおめでとう！')
        return {
          ...prev,
          level: prev.level + 1,
          exp: newExp - prev.expToNextLevel,
          expToNextLevel: Math.floor(prev.expToNextLevel * 1.5)
        }
      }
      return { ...prev, exp: newExp }
    })
  }

  // ガチャストーンを追加する関数
  const addGachaStone = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      gachaStones: prev.gachaStones + amount
    }))
  }

  // 完了したタスク数を更新する関数
  const updateCompletedTasks = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      completedTasks: prev.completedTasks + amount
    }))
  }

  // 実績を確認する関数
  const checkAchievements = useCallback(() => {
    setGameState(prev => {
      const updatedAchievements = prev.achievements.map(achievement => {
        if (!achievement.completed && achievement.condition(prev)) {
          showCharacterMessage(`実績解除したよ！\n実績ページで💎を受け取ろう！`)
          return { ...achievement, completed: true }
        }
        return achievement
      })
      return { ...prev, achievements: updatedAchievements }
    })
  }, [])

  // 実績を受け取る関数
  const claimAchievement = (achievementId: string) => {
    setGameState(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId);
      if (achievement && achievement.completed && !achievement.claimed) {
        const updatedAchievements = prev.achievements.map(a => 
          a.id === achievementId ? { ...a, claimed: true } : a
        );
        showCharacterMessage(`実績報酬で💎を${achievement.reward}個獲得したよ！\nやったね！`);
        return {
          ...prev,
          gachaStones: prev.gachaStones + achievement.reward,
          achievements: updatedAchievements
        };
      }
      return prev;
    });
  };

  // ゲーム状態の変化を監視して実績を確認
  useEffect(() => {
    checkAchievements()
  }, [gameState.level, gameState.completedTasks, gameState.characters.length, checkAchievements])

  // ガチャを引く関数
  const performGacha = () => {
    if (gameState.gachaStones < 5) {
      showCharacterMessage('💎が足りないみたい...\nタスクに取り組もう！')
      return
    }

    setGameState(prev => ({
      ...prev,
      gachaStones: prev.gachaStones - 5,
      gachaCount: prev.gachaCount + 1
    }))

    const newCharacter = allCharacters[Math.floor(Math.random() * allCharacters.length)]
    setGameState(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter],
    }))
    setSelectedCharacter(newCharacter)
    setIsGachaModalOpen(true)
    
    const isNewCharacter = !gameState.characters.some(char => char.id === newCharacter.id)
    if (isNewCharacter) {
      showCharacterMessage(`新しいキャラ「${newCharacter.name}」を獲得したよ！\nやったね！`)
    } else {
      showCharacterMessage(`「${newCharacter.name}」が重複して出現したよ！`)
    }
  }

  // 現在のキャラクターを変更する関数
  const changeCurrentCharacter = (character: Character) => {
    setGameState(prev => ({
      ...prev,
      currentCharacter: character,
    }))
    setCurrentPage('character')
    setIsCharacterDetailModalOpen(false)
    showCharacterMessage(`よろしくね！\n一緒に頑張ろう！`)
  }

  // キャラクターのメッセージを表示する関数
  const showCharacterMessage = (message: string) => {
    setCharacterMessage(message);
    startAnimation();
  };

  // チャットの送信を処理する関数
  const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (chatInput.trim() !== '') {
      setUserMessage(chatInput)
      setChatInput('')
      startAnimation();
      
      // 考え中状態を表示
      setIsThinking(true);
      showCharacterMessage('考え中...');
      
      try {
        // APIキーが設定されているか確認
        const response = await generateCharacterResponse(
          gameState.currentCharacter.name,
          gameState.currentCharacter.description,
          chatInput
        );
        
        // 考え中状態を解除して回答を表示
        setIsThinking(false);
        // レスポンスが空文字列の場合（APIキーが設定されていない場合）
        if (response === '') {
          showCharacterMessage('メッセージありがとう！');
        } else {
          showCharacterMessage(response);
        }
      } catch (error) {
        console.error('Error in chat:', error);
        // エラー時も考え中状態を解除
        setIsThinking(false);
        showCharacterMessage('ごめんね、上手く聞き取れなかったみたい...');
      }
    }
  }, [chatInput, gameState.currentCharacter, showCharacterMessage]);

  // Todoリストが変更されたときに編集入力にフォーカスを当てる
  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [todos])

  // 完了していないTodoと完了したTodoをフィルタリング
  const activeTodos = todos.filter(todo => !todo.completed)
  const completedTodos = todos.filter(todo => todo.completed)

  // スタイルを追加するためのエフェクトを更新
  useEffect(() => {
    const style = document.createElement('style');
    const animations = `
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translateY(10px); }
        5%, 95% { opacity: 1; transform: translateY(0); }
      }
      @keyframes talking {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes shake {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-10px); }
        75% { transform: translateY(10px); }
      }
      @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        70% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
    `;
    style.innerHTML = animations + `
      .animate-talking {
        animation: talking 0.5s ease-in-out infinite;
      }
      .animate-shake {
        animation: shake 0.3s ease-in-out infinite;
      }
      .animate-pop-in {
        animation: popIn 0.5s ease-out forwards;
      }
      .sparkle {
        position: absolute;
        width: 10px;
        height: 10px;
        background: gold;
        border-radius: 50%;
        animation: sparkle 0.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ガチャページコンポーネントを更新
  const GachaPage = ({ gameState }: { gameState: GameState }) => {
    const [isShaking, setIsShaking] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);
    const [showPopAnimation, setShowPopAnimation] = useState(false);

    // ガチャを引く処理を更新
    const handleGacha = async () => {
      if (gameState.gachaStones < 5) {
        showCharacterMessage('💎が足りないみたい...\nタスクに取り組もう！');
        return;
      }

      setShowPopAnimation(false); // アニメーションをリセット
      setIsShaking(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsShaking(false);
      setShowSparkles(true);
      
      performGacha();
      setShowPopAnimation(true); // 新しいキャラクター表示時にアニメーションを有効化
      
      setTimeout(() => {
        setShowSparkles(false);
      }, 1000);
    };

    return (
      <div className="flex flex-col items-center justify-between h-full relative px-4">
        <StatusBar gameState={gameState} />
        <div className="flex-grow flex flex-col items-center justify-center relative">
          {/* キラキラエフェクト */}
          {showSparkles && (
            <>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="sparkle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                />
              ))}
            </>
          )}
          <img
            src="images/gacha/gachagacha.png"
            alt="ガチャガチャマシン"
            className={`w-64 h-64 object-contain mb-4 transition-all duration-300 ${
              isShaking ? 'animate-shake' : ''
            }`}
          />
          <Button
            className="w-full max-w-xs"
            onClick={handleGacha}
            disabled={gameState.gachaStones < 5 || isShaking}
          >
            {isShaking ? 'ガチャ実行中...' : 'ガチャを引く (💎5)'}
          </Button>
        </div>
        <Modal isOpen={isGachaModalOpen} onClose={() => setIsGachaModalOpen(false)}>
          {selectedCharacter && (
            <div className={`flex flex-col items-center ${showPopAnimation ? 'animate-pop-in' : ''}`}>
              <img
                src={selectedCharacter.image}
                alt={`${selectedCharacter.name}キャラクター`}
                className="w-24 h-24 object-contain mb-2"
              />
              <h3 className="text-lg font-semibold mb-1">{selectedCharacter.name}</h3>
              <p className="text-xs text-muted-foreground mb-2 text-center">
                {selectedCharacter.description}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  changeCurrentCharacter(selectedCharacter)
                  setIsGachaModalOpen(false)
                  // モーダルを閉じる時にアニメーション状態をリセット
                  setShowPopAnimation(false)
                }}
              >
                このキャラクターを選択
              </Button>
            </div>
          )}
        </Modal>
      </div>
    );
  };

  // レポートページコンポーネントを定義
  const ReportPage = ({ gameState, completedTodos }: { gameState: GameState, completedTodos: Todo[] }) => {
    const totalCompletedTasks = completedTodos.length;
    const thisWeekCompletedTasks = completedTodos.filter(todo => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return todo.completedAt && todo.completedAt > oneWeekAgo;
    }).length;
    const consecutiveDays = calculateConsecutiveDays();

    return (
      <div className="flex flex-col items-center justify-between h-full relative px-4">
        <StatusBar gameState={gameState} />
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md space-y-12">
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">総完了タスク数</h3>
            <p className="text-6xl font-bold">{totalCompletedTasks}</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">今週の達成数</h3>
            <p className="text-6xl font-bold">{thisWeekCompletedTasks}</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">連続達成日数</h3>
            <p className="text-6xl font-bold">{consecutiveDays}</p>
          </div>
        </div>
      </div>
    );
  };

  // 連続達成日数を計算する関数
  const calculateConsecutiveDays = () => {
    if (completedTodos.length === 0) return 0;

    const sortedCompletedTodos = completedTodos
      .filter(todo => todo.completedAt)
      .sort((a, b) => (b.completedAt as Date).getTime() - (a.completedAt as Date).getTime());

    let consecutiveDays = 1;
    let currentDate = new Date(sortedCompletedTodos[0].completedAt as Date);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedCompletedTodos.length; i++) {
      const todoDate = new Date(sortedCompletedTodos[i].completedAt as Date);
      todoDate.setHours(0, 0, 0, 0);

      const diffDays = (currentDate.getTime() - todoDate.getTime()) / (1000 * 3600 * 24);

      if (diffDays === 1) {
        consecutiveDays++;
        currentDate = todoDate;
      } else if (diffDays > 1) {
        break;
      }
    }

    return consecutiveDays;
  };

  // ナビゲーションバーコンポーネントを定義
  const NavigationBar = () => (
    <div className="flex justify-around items-center bg-background p-2 rounded-lg shadow-md">
      {[
        { icon: Home, label: 'トップ', page: 'character' },
        { icon: Dice5, label: 'ガチャ', page: 'gacha' },
        { icon: Users, label: 'キャラ', page: 'characterList' },
        { icon: Trophy, label: '実績', page: 'achievements' },
        { icon: BarChart2, label: 'レポート', page: 'report' },
      ].map(({ icon: Icon, label, page }) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "ghost"}
          className={`flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200 w-16 h-16 ${
            currentPage === page 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-muted'
          }`}
          onClick={() => setCurrentPage(page as 'achievements' | 'character' | 'gacha' | 'characterList' | 'report')}
        >
          <Icon className={`h-6 w-6 mb-1 ${currentPage === page ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${currentPage === page ? 'font-bold' : 'font-medium'}`}>{label}</span>
        </Button>
      ))}
    </div>
  )

  // アニメーションを開始するエフェクト
  useEffect(() => {
    startAnimation();
  }, []);

  // アプリのUIをレンダリング
  return (
    <div className="flex flex-col md:flex-row h-screen p-4 bg-background">
      <div className="w-full md:w-1/3 p-4 bg-card rounded-lg shadow-lg mb-4 md:mb-0 md:mr-4 flex flex-col h-[calc(100vh-32px)]">
        <div className="flex-grow overflow-hidden relative mb-4">
          {currentPage === 'character' && (
            <CharacterPage
              gameState={gameState}
              characterMessage={characterMessage}
              userMessage={userMessage}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleChatSubmit={handleChatSubmit}
              isAnimating={isAnimating}
            />
          )}
          {currentPage === 'gacha' && <GachaPage gameState={gameState} />}
          {currentPage === 'characterList' && (
            <CharacterListPage
              gameState={gameState}
              selectedCharacter={selectedCharacter}
              setSelectedCharacter={setSelectedCharacter}
              isCharacterDetailModalOpen={isCharacterDetailModalOpen}
              setIsCharacterDetailModalOpen={setIsCharacterDetailModalOpen}
              changeCurrentCharacter={changeCurrentCharacter}
            />
          )}
          {currentPage === 'achievements' && <AchievementsPage gameState={gameState} claimAchievement={claimAchievement} />}
          {currentPage === 'report' && <ReportPage gameState={gameState} completedTodos={completedTodos} />}
        </div>
        <NavigationBar />
      </div>
      <div className="w-full md:w-2/3 p-4 bg-card rounded-lg shadow-lg flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-center">TODOリスト</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <Label htmlFor="show-completed">完了したタスクを表示</Label>
          </div>
        </div>
        <div className="flex mb-4">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="mr-2"
            onKeyDown={(e) => {
              // 変換中でない場合のみ Enter キーでタスクを追加
              if (e.key === 'Enter' && !isComposingRef.current) {
                e.preventDefault();
                addTodo();
              }
            }}
            // 日本語入力の変換開始時と終了時のイベントハンドラを追加
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
          />
          <Button onClick={addTodo}>追加</Button>
        </div>
        <div className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Reorder.Group axis="y" values={activeTodos} onReorder={(newOrder) => setTodos([...newOrder, ...completedTodos])}>
            <AnimatePresence>
              {activeTodos.map((todo) => (
                <Reorder.Item key={todo.id} value={todo} as="div">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-muted p-3 rounded-md mb-2"
                  >
                    <div className="flex items-center flex-grow mr-2">
                                            <GripVertical className="h-5 w-5 mr-2 cursor-move text-muted-foreground" />
                      <Checkbox
                                                id={`todo-${todo.id}`}
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="mr-2"
                      />
                      {todo.isEditing ? (
                        <Input
                          ref={editInputRef}
                          type="text"
                          defaultValue={todo.text}
                          onBlur={(e) => stopEditing(todo.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') stopEditing(todo.id, e.currentTarget.value)
                            if (e.key === 'Escape') stopEditing(todo.id)
                          }}
                          className="flex-grow"
                        />
                      ) : (
                        <label
                          htmlFor={`todo-${todo.id}`}
                          className={`flex-grow cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                          onClick={() => startEditing(todo.id)}
                        >
                          {todo.text}
                        </label>
                      )}
                    </div>
                    {todo.isEditing ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => stopEditing(todo.id)}
                        aria-label="編集をキャンセル"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo.id)}
                        aria-label="タスクを削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
          {showCompleted && completedTodos.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">完了したタスク</h3>
              <AnimatePresence>
                {completedTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-muted p-3 rounded-md mb-2"
                  >
                    <div className="flex items-center flex-grow mr-2">
                      <Checkbox
                        id={`completed-todo-${todo.id}`}
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="mr-2"
                      />
                      <label
                        htmlFor={`completed-todo-${todo.id}`}
                        className="flex-grow cursor-pointer line-through text-muted-foreground"
                      >
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      aria-label="タスクを削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
