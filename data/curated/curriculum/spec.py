def L(title, idea, ccc, scripture, vocab, question, activity, prayer='', **extra):
    d = dict(title=title, idea=idea, ccc=ccc, scripture=scripture, vocab=vocab.split(), question=question, activity=activity, prayer=prayer)
    d.update(extra)
    return d
def U(title, pillar, eq, lessons):
    assert len(lessons) == 3, title
    return dict(title=title, pillar=pillar, eq=eq, lessons=lessons)
