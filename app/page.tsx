"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Minus, GripVertical, HelpCircle } from "lucide-react";
import "katex/dist/katex.min.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockMath } from "react-katex";

interface ScoreItem {
  id: string;
  value: string;
  isRelevant: boolean;
}

interface SortableScoreInputProps {
  score: ScoreItem;
  onChange: (index: number, value: string) => void;
  onRelevanceChange: (index: number, isRelevant: boolean) => void;
  index: number;
  maxScore: number;
  id: string;
}

const MetricDisplay: React.FC<{
  label: string;
  value: number | null;
  k: number;
}> = ({ label, value, k }) => (
  <div className="bg-gray-100 rounded-lg p-3 flex flex-col items-center justify-center">
    <div className="text-sm font-semibold text-gray-600">
      {label}@{k}
    </div>
    <div className="text-lg font-bold text-blue-600">
      {value !== null ? value.toFixed(4) : "N/A"}
    </div>
  </div>
);

const SortableScoreInput: React.FC<SortableScoreInputProps> = ({
  score,
  onChange,
  onRelevanceChange,
  index,
  maxScore,
  id,
}) => {
  const barWidth = score.value ? (Number(score.value) / maxScore) * 100 : 0;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 relative mb-2"
    >
      <GripVertical className="cursor-move" {...attributes} {...listeners} />
      <span className="w-6">{index + 1}.</span>
      <div className="w-full relative">
        <div
          className="absolute inset-y-0 left-0 bg-blue-200 z-0"
          style={{ width: `${barWidth}%` }}
        />
        <Input
          type="number"
          value={score.value}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder="関連性スコア"
          className="w-full relative z-10 bg-transparent"
          min="0"
          max={maxScore.toString()}
        />
      </div>
      <input
        type="checkbox"
        checked={score.isRelevant}
        onChange={(e) => onRelevanceChange(index, e.target.checked)}
        className="ml-2"
      />
    </div>
  );
};

const HelpSheet: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-lg">情報検索指標の定義</SheetTitle>
          <SheetDescription>
            各指標の数学的定義は以下の通りです：
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-bold text-base">NDCG@k</h3>
              <BlockMath math={`NDCG@k = \\frac{DCG@k}{IDCG@k}`} />
              <BlockMath
                math={`DCG@k = \\sum_{i=1}^k \\frac{2^{rel_i} - 1}{\\log_2(i+1)}`}
              />
              <p className="mt-2">IDCGはDCGの理想的な（最大の）値です。</p>
            </div>
            <div>
              <h3 className="font-bold text-base">Precision@k</h3>
              <BlockMath
                math={`Precision@k = \\frac{\\text{関連アイテム数@k}}{k}`}
              />
            </div>
            <div>
              <h3 className="font-bold text-base">Recall@k</h3>
              <BlockMath
                math={`Recall@k = \\frac{\\text{関連アイテム数@k}}{\\text{全関連アイテム数}}`}
              />
            </div>
            <div>
              <h3 className="font-bold text-base">MAP@k</h3>
              <BlockMath
                math={`MAP@k = \\frac{1}{|Q|} \\sum_{q=1}^{|Q|} \\frac{\\sum_{k=1}^n (P(k) \\times rel(k))}{\\text{関連文書数}}`}
              />
              <p className="mt-2">
                ここで、P(k)はk番目のアイテムまでの精度、rel(k)はk番目のアイテムが関連なら1、そうでなければ0です。
              </p>
            </div>
            <div>
              <h3 className="font-bold text-base">MRR@k</h3>
              <BlockMath
                math={`MRR@k = \\frac{1}{|Q|} \\sum_{i=1}^{|Q|} \\frac{1}{rank_i}`}
              />
              <p className="mt-2">
                ここで、rank_iは最初の関連アイテムの順位です（k以内に関連アイテムがない場合は0とします）。
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
const IRMetricsSimulation: React.FC = () => {
  const [scores, setScores] = useState<ScoreItem[]>(
    Array(10)
      .fill("")
      .map((_, i) => ({ id: `score-${i}`, value: "", isRelevant: false })),
  );
  const [ndcg, setNDCG] = useState<number | null>(null);
  const [precision, setPrecision] = useState<number | null>(null);
  const [recall, setRecall] = useState<number | null>(null);
  const [map, setMAP] = useState<number | null>(null);
  const [mrr, setMRR] = useState<number | null>(null);
  const [maxScore, setMaxScore] = useState<number>(5);
  const [k, setK] = useState<number>(scores.length);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const calculateDCG = useCallback(
    (relevanceScores: number[], k: number): number => {
      return relevanceScores.slice(0, k).reduce((sum, score, index) => {
        return sum + (Math.pow(2, score) - 1) / Math.log2(index + 2);
      }, 0);
    },
    [],
  );

  const calculateNDCG = useCallback(
    (relevanceScores: number[], k: number): number | null => {
      if (relevanceScores.some(isNaN)) {
        return null;
      }

      const dcg = calculateDCG(relevanceScores, k);
      const idcg = calculateDCG(
        [...relevanceScores].sort((a, b) => b - a),
        k,
      );
      return dcg / idcg;
    },
    [calculateDCG],
  );

  const calculatePrecision = useCallback(
    (relevantItems: boolean[], k: number): number => {
      const relevantCount = relevantItems.slice(0, k).filter(Boolean).length;
      return relevantCount / k;
    },
    [],
  );

  const calculateRecall = useCallback(
    (relevantItems: boolean[], k: number): number => {
      const relevantCount = relevantItems.slice(0, k).filter(Boolean).length;
      const totalRelevant = relevantItems.filter(Boolean).length;
      return totalRelevant === 0 ? 0 : relevantCount / totalRelevant;
    },
    [],
  );

  const calculateMAP = useCallback(
    (relevantItems: boolean[], k: number): number => {
      let sum = 0;
      let relevantCount = 0;
      for (let i = 0; i < k; i++) {
        if (relevantItems[i]) {
          relevantCount++;
          sum += relevantCount / (i + 1);
        }
      }
      return relevantCount === 0 ? 0 : sum / relevantCount;
    },
    [],
  );

  const calculateMRR = useCallback(
    (relevantItems: boolean[], k: number): number => {
      const firstRelevantIndex = relevantItems.slice(0, k).findIndex(Boolean);
      return firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1);
    },
    [],
  );

  const handleScoreChange = (index: number, value: string) => {
    const newScores = [...scores];
    newScores[index].value = value;
    setScores(newScores);
  };

  const handleRelevanceChange = (index: number, isRelevant: boolean) => {
    const newScores = [...scores];
    newScores[index].isRelevant = isRelevant;
    setScores(newScores);
  };

  const handleMaxScoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxScore = Math.max(1, parseInt(event.target.value) || 1);
    setMaxScore(newMaxScore);
    setScores(
      scores.map((score) => ({
        ...score,
        value: Math.min(Number(score.value), newMaxScore).toString(),
      })),
    );
  };

  const handleKChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newK = Math.max(
      1,
      Math.min(parseInt(event.target.value) || 1, scores.length),
    );
    setK(newK);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setScores((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateRandomScores = () => {
    const newScores = scores.map((score) => ({
      ...score,
      value: Math.floor(Math.random() * (maxScore + 1)).toString(),
      isRelevant: Math.random() < 0.5,
    }));
    setScores(newScores);
  };

  const shuffleScores = () => {
    const newScores = [...scores];
    for (let i = newScores.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newScores[i], newScores[j]] = [newScores[j], newScores[i]];
    }
    setScores(newScores);
  };

  const sortScoresForMaxNDCG = () => {
    const sortedScores = [...scores].sort(
      (a, b) => Number(b.value) - Number(a.value),
    );
    setScores(sortedScores);
  };

  const sortScoresForMinNDCG = () => {
    const sortedScores = [...scores].sort(
      (a, b) => Number(a.value) - Number(b.value),
    );
    setScores(sortedScores);
  };

  const addListItem = () => {
    setScores([
      ...scores,
      { id: `score-${scores.length}`, value: "", isRelevant: false },
    ]);
    setK(k + 1);
  };

  const removeListItem = () => {
    if (scores.length > 1) {
      setScores(scores.slice(0, -1));
      setK(Math.min(k, scores.length - 1));
    }
  };

  useEffect(() => {
    const relevanceScores = scores.map((score) => Number(score.value));
    const relevantItems = scores.map((score) => score.isRelevant);

    const newNDCG = calculateNDCG(relevanceScores, k);
    const newPrecision = calculatePrecision(relevantItems, k);
    const newRecall = calculateRecall(relevantItems, k);
    const newMAP = calculateMAP(relevantItems, k);
    const newMRR = calculateMRR(relevantItems, k);

    setNDCG(newNDCG);
    setPrecision(newPrecision);
    setRecall(newRecall);
    setMAP(newMAP);
    setMRR(newMRR);
  }, [
    scores,
    k,
    calculateNDCG,
    calculatePrecision,
    calculateRecall,
    calculateMAP,
    calculateMRR,
  ]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              情報検索指標シミュレーション（リストサイズ: {scores.length}）
            </CardTitle>
            <HelpSheet />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MetricDisplay label="NDCG" value={ndcg} k={k} />
            <MetricDisplay label="Precision" value={precision} k={k} />
            <MetricDisplay label="Recall" value={recall} k={k} />
            <MetricDisplay label="MAP" value={map} k={k} />
            <MetricDisplay label="MRR" value={mrr} k={k} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span>最大スコア:</span>
              <Input
                type="number"
                value={maxScore}
                onChange={handleMaxScoreChange}
                min="1"
                className="w-20"
              />
              <span className="ml-4">k:</span>
              <Input
                type="number"
                value={k}
                onChange={handleKChange}
                min="1"
                max={scores.length.toString()}
                className="w-20"
              />
            </div>
            <SortableContext
              items={scores.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {scores.map((score, index) => (
                <SortableScoreInput
                  key={score.id}
                  id={score.id}
                  score={score}
                  onChange={handleScoreChange}
                  onRelevanceChange={handleRelevanceChange}
                  index={index}
                  maxScore={maxScore}
                />
              ))}
            </SortableContext>
            <div className="flex justify-center space-x-2">
              <Button onClick={removeListItem} disabled={scores.length <= 1}>
                <Minus className="w-4 h-4 mr-2" />
                削除
              </Button>
              <Button onClick={addListItem}>
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={generateRandomScores}>ランダム生成</Button>
              <Button onClick={shuffleScores}>シャッフル</Button>
              <Button onClick={sortScoresForMaxNDCG}>最大NDCGにソート</Button>
              <Button onClick={sortScoresForMinNDCG}>最小NDCGにソート</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DndContext>
  );
};

export default IRMetricsSimulation;
